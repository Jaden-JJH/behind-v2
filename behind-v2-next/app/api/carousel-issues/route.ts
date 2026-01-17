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
    // approval_status가 'approved'이고 visibility가 'active'인 이슈 중에서 캐러셀 슬롯이 활성화된 것만 조회
    const { data: issues, error } = await supabase
      .from('issues')
      .select('id, display_id, title, preview, thumbnail, show_in_carousel_slot1, show_in_carousel_slot2, show_in_carousel_slot3, show_in_carousel_slot4, show_in_carousel_slot5')
      .eq('approval_status', 'approved')
      .eq('visibility', 'active')
      .or('show_in_carousel_slot1.eq.true,show_in_carousel_slot2.eq.true,show_in_carousel_slot3.eq.true,show_in_carousel_slot4.eq.true,show_in_carousel_slot5.eq.true')
      .order('display_id', { ascending: true }) // 일관된 순서 보장

    if (error) {
      console.error('Failed to fetch carousel issues:', error)
      return NextResponse.json({ error: 'Failed to fetch carousel issues' }, { status: 500 })
    }

    // 슬롯별로 첫 번째 매칭되는 이슈만 선택 (중복 방지)
    const slot1 = issues?.find(issue => issue.show_in_carousel_slot1)
    const slot2 = issues?.find(issue => issue.show_in_carousel_slot2)
    const slot3 = issues?.find(issue => issue.show_in_carousel_slot3)
    const slot4 = issues?.find(issue => issue.show_in_carousel_slot4)
    const slot5 = issues?.find(issue => issue.show_in_carousel_slot5)

    // 슬롯 순서대로 배열 구성
    const carouselIssues = []
    if (slot1) carouselIssues.push({
      id: slot1.id,
      display_id: slot1.display_id,
      title: slot1.title,
      preview: slot1.preview,
      thumbnail: slot1.thumbnail,
      position: 1
    })
    if (slot2) carouselIssues.push({
      id: slot2.id,
      display_id: slot2.display_id,
      title: slot2.title,
      preview: slot2.preview,
      thumbnail: slot2.thumbnail,
      position: 2
    })
    if (slot3) carouselIssues.push({
      id: slot3.id,
      display_id: slot3.display_id,
      title: slot3.title,
      preview: slot3.preview,
      thumbnail: slot3.thumbnail,
      position: 3
    })
    if (slot4) carouselIssues.push({
      id: slot4.id,
      display_id: slot4.display_id,
      title: slot4.title,
      preview: slot4.preview,
      thumbnail: slot4.thumbnail,
      position: 4
    })
    if (slot5) carouselIssues.push({
      id: slot5.id,
      display_id: slot5.display_id,
      title: slot5.title,
      preview: slot5.preview,
      thumbnail: slot5.thumbnail,
      position: 5
    })

    return NextResponse.json({
      success: true,
      data: carouselIssues
    })
  } catch (error: any) {
    console.error('Carousel issues API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
