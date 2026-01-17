import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET() {
  try {
    // 1. 어드민 인증 확인
    await requireAdminAuth()

    // 2. pending 상태 콘텐츠 신고 개수 조회
    const { count, error } = await supabaseAdmin
      .from('content_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 3. 에러 처리
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 4. 성공 응답
    return NextResponse.json({ count: count || 0 }, { status: 200 })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
