// import { NextResponse } from 'next/server'
// import { cookies } from 'next/headers'
// import { supabase } from '@/lib/supabase'

// export async function GET() {
//   try {
//     // 1. 어드민 인증 확인
//     const authCookie = cookies().get('admin-auth')
//     if (authCookie?.value !== 'true') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     // 2. pending 상태 리포트 개수 조회
//     const { count, error } = await supabase
//       .from('reports')
//       .select('*', { count: 'exact', head: true })
//       .eq('status', 'pending')

//     // 3. 에러 처리
//     if (error) {
//       console.error('Supabase error:', error)
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     // 4. 성공 응답
//     return NextResponse.json({ count: count || 0 }, { status: 200 })
//   } catch (error: any) {
//     console.error('API error:', error)
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
//   }
// }

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 1. 어드민 인증 확인 (Next.js 15 await)
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 모든 리포트 조회 후 필터링
    const { data, error } = await supabase
      .from('reports')
      .select('curious_count, threshold, approval_status, visibility')
      .eq('approval_status', 'pending')

    // 3. 에러 처리
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 4. JavaScript로 100% 달성 필터링
    const pendingCount = data?.filter(
      report => report.curious_count >= report.threshold
    ).length || 0

    // 5. 성공 응답
    return NextResponse.json({ count: pendingCount }, { status: 200 })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}