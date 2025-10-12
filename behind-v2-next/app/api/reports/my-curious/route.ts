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
    const deviceHash = searchParams.get('device_hash')

    // 2. 필수 필드 검증
    if (!deviceHash) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'device_hash' })
    }

    // 3. report_curious 테이블 조회
    const { data, error } = await supabase
      .from('report_curious')
      .select('report_id')
      .eq('device_hash', deviceHash)

    // 4. 에러 처리
    if (error) {
      console.error('Supabase error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    // 5. report_id 배열 추출 및 응답
    const reportIds = data.map(item => item.report_id)
    return createSuccessResponse({ report_ids: reportIds }, 200)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
