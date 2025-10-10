import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버에서만 사용하는 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Supabase에서 메인 노출 이슈만 조회
    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        poll:polls(
          id,
          question,
          seed_total,
          batch_min,
          batch_max,
          options:poll_options(
            id,
            label,
            vote_count
          )
        )
      `)
      .or('show_in_main_hot.eq.true,show_in_main_poll.eq.true')
      .order('show_in_main_hot', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch issues' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: issues,
      count: issues.length
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
