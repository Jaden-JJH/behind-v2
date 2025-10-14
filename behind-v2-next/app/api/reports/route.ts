import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'
import { sanitizeHtml } from '@/lib/sanitize'

// 서버에서만 사용하는 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // 1. 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const visibility = searchParams.get('visibility')
    const approvalStatus = searchParams.get('approval_status')
    const sortBy = searchParams.get('sortBy') || 'latest'
    const deviceHash = searchParams.get('device_hash')
    const myCurious = searchParams.get('my_curious') === 'true'

    // 2. my_curious 처리 (deviceHash && myCurious인 경우만)
    let reportIds: number[] = []
    if (deviceHash && myCurious) {
      const { data: curiousData, error: curiousError } = await supabase
        .from('report_curious')
        .select('report_id')
        .eq('device_hash', deviceHash)

      if (curiousError) {
        console.error('Supabase error (report_curious):', curiousError)
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, curiousError.message)
      }

      reportIds = curiousData.map(r => r.report_id)

      // 배열이 비어있으면 즉시 반환
      if (reportIds.length === 0) {
        return createSuccessResponse([], 200, 0)
      }
    }

    // 3. reports 테이블 쿼리
    let query = supabase.from('reports').select('*')

    // visibility 필터 적용
    if (visibility) {
      query = query.eq('visibility', visibility)
    }

    // approval_status 필터 적용
    if (approvalStatus) {
      query = query.eq('approval_status', approvalStatus)
    }

    // my_curious 필터 적용
    if (myCurious && reportIds.length > 0) {
      query = query.in('id', reportIds)
    }

    // 정렬 (기본: 최신순)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Supabase error (reports):', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    if (!data) {
      return createSuccessResponse([], 200, 0)
    }

    // 4. sortBy='progress'면 JavaScript 정렬
    if (sortBy === 'progress') {
      data.sort((a, b) => {
        const progressA = a.curious_count / a.threshold
        const progressB = b.curious_count / b.threshold
        return progressB - progressA
      })
    }

    // 5. is_curious 필드 추가 (deviceHash 있을 때만)
    let finalData = data
    if (deviceHash) {
      const reportIdsForCurious = data.map(r => r.id)

      if (reportIdsForCurious.length > 0) {
        const { data: curiousCheckData, error: curiousCheckError } = await supabase
          .from('report_curious')
          .select('report_id')
          .eq('device_hash', deviceHash)
          .in('report_id', reportIdsForCurious)

        if (curiousCheckError) {
          console.error('Supabase error (is_curious check):', curiousCheckError)
          // is_curious 체크 실패해도 데이터는 반환
          finalData = data.map(report => ({ ...report, is_curious: false }))
        } else {
          const curiousSet = new Set(curiousCheckData.map(r => r.report_id))
          finalData = data.map(report => ({
            ...report,
            is_curious: curiousSet.has(report.id)
          }))
        }
      } else {
        finalData = data.map(report => ({ ...report, is_curious: false }))
      }
    }

    // 6. 응답
    return createSuccessResponse(finalData, 200, finalData.length)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function POST(request: Request) {
  try {
    // 1. 어드민 인증 확인
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin-auth')
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 요청 바디 파싱
    const body = await request.json()
    const { title, reporterName, description, threshold } = body

    // 3. XSS 방어 (sanitize)
    const sanitizedTitle = sanitizeHtml(title)
    const sanitizedReporterName = sanitizeHtml(reporterName)
    const sanitizedDescription = sanitizeHtml(description)

    // 4. 필수 필드 검증
    const missing = validateRequired({
      title: sanitizedTitle,
      reporterName: sanitizedReporterName,
      description: sanitizedDescription,
      threshold
    })
    if (missing.length > 0) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
    }

    // 5. 길이 및 값 검증
    if (sanitizedTitle.length < 2 || sanitizedTitle.length > 100) {
      return NextResponse.json(
        { error: '제목은 2자 이상 100자 이하여야 합니다' },
        { status: 400 }
      )
    }

    if (sanitizedReporterName.length < 2 || sanitizedReporterName.length > 20) {
      return NextResponse.json(
        { error: '제보자 닉네임은 2자 이상 20자 이하여야 합니다' },
        { status: 400 }
      )
    }

    if (sanitizedDescription.length < 2 || sanitizedDescription.length > 30) {
      return NextResponse.json(
        { error: '추가정보는 2자 이상 30자 이하여야 합니다' },
        { status: 400 }
      )
    }

    if (!threshold || threshold < 10) {
      return NextResponse.json(
        { error: '정원은 최소 10명 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // 6. Supabase insert
    const { data, error } = await supabase
      .from('reports')
      .insert({
        title: sanitizedTitle,
        reporter_name: sanitizedReporterName,
        description: sanitizedDescription,
        threshold: threshold,
        approval_status: 'pending',
        visibility: 'paused',
        curious_count: 0
      })
      .select()
      .single()

    // 7. 에러 처리
    if (error) {
      console.error('Supabase error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    // 8. 성공 응답
    return createSuccessResponse(data, 201)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
