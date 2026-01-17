import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // 1. 어드민 인증 확인 (Next.js 15 await)
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
