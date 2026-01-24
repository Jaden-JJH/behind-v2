import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 30 // 30초마다 재검증

// 서버에서만 사용하는 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // status가 'active'인 이슈 중에서 배너 슬롯이 활성화된 것만 조회
    const { data: issues, error } = await supabase
      .from('issues')
      .select('id, display_id, title, show_in_banner_slot1, show_in_banner_slot2, show_in_banner_slot3')
      .eq('status', 'active')
      .or('show_in_banner_slot1.eq.true,show_in_banner_slot2.eq.true,show_in_banner_slot3.eq.true')
      .order('display_id', { ascending: true }) // 일관된 순서 보장

    if (error) {
      console.error('Failed to fetch banner issues:', error)
      return NextResponse.json({ error: 'Failed to fetch banner issues' }, { status: 500 })
    }

    // 슬롯별로 첫 번째 매칭되는 이슈만 선택 (중복 방지)
    const slot1 = issues?.find(issue => issue.show_in_banner_slot1)
    const slot2 = issues?.find(issue => issue.show_in_banner_slot2)
    const slot3 = issues?.find(issue => issue.show_in_banner_slot3)

    // 슬롯 순서대로 배열 구성
    const bannerIssues = []
    if (slot1) bannerIssues.push({ id: slot1.id, display_id: slot1.display_id, title: slot1.title, position: 1 })
    if (slot2) bannerIssues.push({ id: slot2.id, display_id: slot2.display_id, title: slot2.title, position: 2 })
    if (slot3) bannerIssues.push({ id: slot3.id, display_id: slot3.display_id, title: slot3.title, position: 3 })

    return NextResponse.json({
      success: true,
      data: bannerIssues
    })
  } catch (error: any) {
    console.error('Banner issues API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
