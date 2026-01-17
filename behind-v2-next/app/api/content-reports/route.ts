import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'
import { sanitizeHtml } from '@/lib/sanitize'
import { reportLimiter, getClientIp } from '@/lib/rate-limiter'
import { withCsrfProtection } from '@/lib/api-helpers'
import { sendReportNotificationToAdmin } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 신고 사유 목록 (정확히 지정된 옵션만 허용)
const VALID_REPORT_REASONS = [
  '욕설/비방/혐오 표현',
  '허위사실 유포',
  '명예훼손/모욕',
  '개인정보 노출',
  '음란물/불건전 콘텐츠',
  '광고/스팸',
  '기타'
] as const

type ReportReason = typeof VALID_REPORT_REASONS[number]

// 신고 가능한 콘텐츠 타입
const VALID_CONTENT_TYPES = ['issue', 'poll', 'comment'] as const
type ContentType = typeof VALID_CONTENT_TYPES[number]

/**
 * POST /api/content-reports
 * 콘텐츠 신고 생성
 */
export async function POST(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 로그인 체크
      const supabaseServer = await createServerClient()
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

      if (authError || !user) {
        return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
      }

      // 2. 사용자 닉네임 조회
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single()

      if (userError || !userData?.nickname) {
        return createErrorResponse(ErrorCode.UNAUTHORIZED, 401, {
          message: '닉네임을 먼저 설정해주세요'
        })
      }

      // 3. Rate Limiting & IP 주소 가져오기
      const clientIp = getClientIp(req)
      const { success, limit, remaining, reset } = await reportLimiter.limit(clientIp)

      if (!success) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((reset - Date.now()) / 1000)
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          }
        )
      }

      // 4. 요청 데이터 파싱
      const body = await req.json()
      const { contentType, contentId, reason, reasonDetail } = body

      // 5. 입력 검증
      const missing = validateRequired({ contentType, contentId, reason })
      if (missing.length > 0) {
        return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
      }

      // 콘텐츠 타입 검증
      if (!VALID_CONTENT_TYPES.includes(contentType)) {
        return createErrorResponse(ErrorCode.REPORT_INVALID_TYPE, 400, {
          validTypes: VALID_CONTENT_TYPES
        })
      }

      // 신고 사유 검증
      if (!VALID_REPORT_REASONS.includes(reason)) {
        return createErrorResponse(ErrorCode.REPORT_INVALID_REASON, 400, {
          validReasons: VALID_REPORT_REASONS
        })
      }

      // '기타' 선택 시 상세 사유 필수
      if (reason === '기타' && (!reasonDetail || reasonDetail.trim().length === 0)) {
        return createErrorResponse(ErrorCode.REPORT_DETAIL_REQUIRED, 400)
      }

      // 상세 사유 검증 (최대 200자)
      let sanitizedReasonDetail = null
      if (reasonDetail) {
        sanitizedReasonDetail = sanitizeHtml(reasonDetail.trim())
        if (sanitizedReasonDetail.length > 200) {
          return createErrorResponse(ErrorCode.REPORT_DETAIL_TOO_LONG, 400)
        }
      }

      // 5. 중복 신고 체크 (같은 사용자가 같은 콘텐츠를 이미 신고했는지)
      const { data: existingReport, error: checkError } = await supabaseAdmin
        .from('content_reports')
        .select('id')
        .eq('reporter_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking duplicate report:', checkError)
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
      }

      if (existingReport) {
        return createErrorResponse(ErrorCode.REPORT_DUPLICATE, 400)
      }

      // 6. 신고 생성 (IP는 이미 clientIp로 가져옴)
      const { data: report, error: createError } = await supabaseAdmin
        .from('content_reports')
        .insert({
          content_type: contentType,
          content_id: contentId,
          reporter_id: user.id,
          reporter_nick: userData.nickname,
          reporter_ip: clientIp,
          reason,
          reason_detail: sanitizedReasonDetail,
          status: 'pending'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating report:', createError)
        return createErrorResponse(ErrorCode.REPORT_CREATE_FAILED, 500)
      }

      // 7. 해당 콘텐츠의 총 신고 횟수 조회
      const { count: reportCount, error: countError } = await supabaseAdmin
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('status', 'pending')

      if (countError) {
        console.error('Error counting reports:', countError)
      }

      const totalReports = reportCount || 0

      // 8. 3회 이상 신고 시 관리자에게 이메일 발송
      if (totalReports >= 3) {
        // 콘텐츠 정보 조회 (이메일에 포함하기 위해)
        let contentTitle: string | undefined
        let contentPreview: string | undefined

        try {
          if (contentType === 'issue') {
            const { data: issue } = await supabaseAdmin
              .from('issues')
              .select('title, description')
              .eq('id', contentId)
              .single()

            if (issue) {
              contentTitle = issue.title
              contentPreview = issue.description
            }
          } else if (contentType === 'poll') {
            const { data: poll } = await supabaseAdmin
              .from('polls')
              .select('question')
              .eq('id', contentId)
              .single()

            if (poll) {
              contentTitle = poll.question
            }
          } else if (contentType === 'comment') {
            const { data: comment } = await supabaseAdmin
              .from('comments')
              .select('body')
              .eq('id', contentId)
              .single()

            if (comment) {
              contentPreview = comment.body
            }
          }
        } catch (error) {
          console.error('Error fetching content details:', error)
        }

        // 이메일 발송 (비동기, 에러가 나도 신고는 성공)
        sendReportNotificationToAdmin({
          contentType,
          contentId,
          contentTitle,
          contentPreview,
          reportCount: totalReports,
          reportReason: reason,
          reporterNick: userData.nickname,
          reportedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        }).catch(error => {
          console.error('Failed to send admin notification email:', error)
        })
      }

      return createSuccessResponse({
        report,
        totalReports,
        emailSent: totalReports >= 3
      }, 201)

    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}

/**
 * GET /api/content-reports?contentType=issue&contentId=xxx
 * 현재 사용자가 특정 콘텐츠를 이미 신고했는지 확인
 */
export async function GET(request: Request) {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')

    if (!contentType || !contentId) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, {
        field: 'contentType, contentId'
      })
    }

    if (!VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
      return createErrorResponse(ErrorCode.REPORT_INVALID_TYPE, 400)
    }

    // 해당 사용자가 이미 신고했는지 확인
    const { data: report, error } = await supabaseAdmin
      .from('content_reports')
      .select('id, created_at, reason')
      .eq('reporter_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()

    if (error) {
      console.error('Error checking report:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    return createSuccessResponse({
      hasReported: !!report,
      report: report || null
    }, 200)

  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
