import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'

// 서버에서만 사용하는 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // 1. 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
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

    // status 필터 적용
    if (status) {
      query = query.eq('status', status)
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
