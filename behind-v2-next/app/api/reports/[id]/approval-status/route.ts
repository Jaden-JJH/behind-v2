import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'

// 서버에서만 사용하는 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 어드민 인증 확인
      const cookieStore = await cookies()
      const adminAuth = cookieStore.get('admin-auth')
      if (!adminAuth || adminAuth.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // 2. ID 추출
      const reportId = params.id

      // 3. 요청 바디 파싱
      const body = await req.json()
      const { approval_status } = body

      // 4. approval_status 검증
      if (!approval_status || !['pending', 'approved', 'rejected'].includes(approval_status)) {
        return NextResponse.json(
          { error: '유효하지 않은 상태값입니다 (pending, approved, rejected만 가능)' },
          { status: 400 }
        )
      }

      // 5. 리포트 조회 (curious_count와 threshold 확인)
      const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('curious_count, threshold')
        .eq('id', reportId)
        .single()

      if (fetchError) {
        console.error('Supabase error (fetch):', fetchError)
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { error: '해당 리포트를 찾을 수 없습니다' },
            { status: 404 }
          )
        }
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, fetchError.message)
      }

      // 6. curious_count >= threshold 확인
      if (report.curious_count < report.threshold) {
        return NextResponse.json(
          { error: '100% 달성 후 변경 가능합니다' },
          { status: 400 }
        )
      }

      // 7. Supabase update
      const { data, error } = await supabase
        .from('reports')
        .update({ approval_status })
        .eq('id', reportId)
        .select()
        .single()

      // 8. 에러 처리
      if (error) {
        console.error('Supabase error (update):', error)
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
      }

      // 9. 성공 응답
      console.log(`Approval status updated: report_id=${reportId}, new_status=${approval_status}`)
      return createSuccessResponse(data, 200)
    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}
