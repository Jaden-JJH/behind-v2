import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminAuth } from '@/lib/admin-auth'

/**
 * GET /api/admin/reports?status=pending&limit=50&offset=0
 * 신고 내역 조회 (관리자 전용)
 */
export async function GET(request: Request) {
  try {
    // 관리자 인증 확인
    await requireAdminAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending' // pending, approved, rejected, all
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const contentType = searchParams.get('contentType') // 선택적 필터

    // 쿼리 빌더
    let query = supabaseAdmin
      .from('content_reports')
      .select(`
        *
      `, { count: 'exact' })

    // 상태 필터
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // 콘텐츠 타입 필터
    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    // 최신순 정렬
    query = query.order('created_at', { ascending: false })

    // 페이지네이션
    query = query.range(offset, offset + limit - 1)

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    // 콘텐츠 정보 조회 (issue, poll, comment)
    const enrichedReports = await Promise.all(
      (reports || []).map(async (report) => {
        let contentInfo: any = null

        try {
          if (report.content_type === 'issue') {
            const { data } = await supabaseAdmin
              .from('issues')
              .select('title, description, is_blinded')
              .eq('id', report.content_id)
              .single()
            contentInfo = data
          } else if (report.content_type === 'poll') {
            const { data } = await supabaseAdmin
              .from('polls')
              .select('question, is_blinded')
              .eq('id', report.content_id)
              .single()
            contentInfo = data
          } else if (report.content_type === 'comment') {
            const { data } = await supabaseAdmin
              .from('comments')
              .select('body, user_nick, is_blinded')
              .eq('id', report.content_id)
              .single()
            contentInfo = data
          }
        } catch (error) {
          console.error(`Error fetching ${report.content_type} info:`, error)
        }

        return {
          ...report,
          content_info: contentInfo
        }
      })
    )

    return createSuccessResponse({
      reports: enrichedReports,
      total: count,
      limit,
      offset
    }, 200)

  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}

/**
 * PATCH /api/admin/reports
 * 신고 처리 (승인 or 기각) (관리자 전용)
 * Body: { reportId, action: 'approve' | 'reject', reviewNote? }
 */
export async function PATCH(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 관리자 인증 확인
      await requireAdminAuth()

      const body = await req.json()
      const { reportId, action, reviewNote } = body

      if (!reportId || !action) {
        return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, {
          missing: ['reportId', 'action']
        })
      }

      if (action !== 'approve' && action !== 'reject') {
        return createErrorResponse(ErrorCode.INVALID_REQUEST, 400, {
          message: 'action은 approve 또는 reject만 가능합니다'
        })
      }

      // 신고 정보 조회
      const { data: report, error: fetchError } = await supabaseAdmin
        .from('content_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (fetchError || !report) {
        return createErrorResponse(ErrorCode.REPORT_NOT_FOUND, 404)
      }

      // 이미 처리된 신고인지 확인
      if (report.status !== 'pending') {
        return createErrorResponse(ErrorCode.REPORT_ALREADY_PROCESSED, 400, {
          currentStatus: report.status
        })
      }

      const now = new Date().toISOString()

      // 신고 상태 업데이트
      const { error: updateReportError } = await supabaseAdmin
        .from('content_reports')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: now,
          reviewed_by: 'admin', // TODO: 관리자 식별자 개선
          review_note: reviewNote || null
        })
        .eq('id', reportId)

      if (updateReportError) {
        console.error('Error updating report:', updateReportError)
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
      }

      // 승인 시 콘텐츠 블라인드 처리 및 신고 카운트 증가
      if (action === 'approve') {
        const { content_type, content_id } = report
        const tableName = content_type === 'issue' ? 'issues'
                        : content_type === 'poll' ? 'polls'
                        : 'comments'

        // 현재 신고 카운트 조회
        const { data: currentContent } = await supabaseAdmin
          .from(tableName)
          .select('report_count')
          .eq('id', content_id)
          .single()

        const currentReportCount = currentContent?.report_count || 0

        const updateData: any = {
          is_blinded: true,
          blinded_at: now,
          blinded_by: 'admin',
          report_count: currentReportCount + 1
        }

        // 이슈나 투표 블라인드 시 자동으로 노출 상태를 중지로 변경
        if (content_type === 'issue' || content_type === 'poll') {
          // poll이 블라인드되면 해당 issue도 visibility를 paused로
          if (content_type === 'poll') {
            // poll의 issue_id 조회
            const { data: pollData } = await supabaseAdmin
              .from('polls')
              .select('issue_id')
              .eq('id', content_id)
              .single()

            if (pollData?.issue_id) {
              // issue의 visibility를 paused로 변경
              await supabaseAdmin
                .from('issues')
                .update({ visibility: 'paused' })
                .eq('id', pollData.issue_id)
            }
          } else if (content_type === 'issue') {
            // 이슈 자체가 블라인드되면 visibility를 paused로
            updateData.visibility = 'paused'
          }
        }

        const { error: blindError } = await supabaseAdmin
          .from(tableName)
          .update(updateData)
          .eq('id', content_id)

        if (blindError) {
          console.error('Error blinding content:', blindError)
          return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, {
            message: '신고는 승인되었으나 콘텐츠 블라인드 처리 중 오류가 발생했습니다'
          })
        }
      }

      return createSuccessResponse({
        message: action === 'approve'
          ? '신고가 승인되어 콘텐츠가 블라인드 처리되었습니다'
          : '신고가 기각되었습니다',
        reportId,
        action
      }, 200)

    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}
