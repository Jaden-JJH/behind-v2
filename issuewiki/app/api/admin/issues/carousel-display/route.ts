import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withCsrfProtection } from '@/lib/api-helpers'
import { requireAdminAuth } from '@/lib/admin-auth'

// GET: 현재 캐러셀 설정 조회
export async function GET() {
  try {
    // 인증 확인
    await requireAdminAuth()

    // 캐러셀 슬롯이 활성화된 이슈 조회
    const { data: issues, error } = await supabaseAdmin
      .from('issues')
      .select('id, display_id, title, show_in_carousel_slot1, show_in_carousel_slot2, show_in_carousel_slot3, show_in_carousel_slot4, show_in_carousel_slot5, approval_status, visibility')
      .or('show_in_carousel_slot1.eq.true,show_in_carousel_slot2.eq.true,show_in_carousel_slot3.eq.true,show_in_carousel_slot4.eq.true,show_in_carousel_slot5.eq.true')

    if (error) {
      console.error('Failed to fetch carousel issues:', error)
      return NextResponse.json({ error: 'Failed to fetch carousel issues' }, { status: 500 })
    }

    // 슬롯별로 정리
    const carouselSlots = {
      slot1: issues?.find(i => i.show_in_carousel_slot1) || null,
      slot2: issues?.find(i => i.show_in_carousel_slot2) || null,
      slot3: issues?.find(i => i.show_in_carousel_slot3) || null,
      slot4: issues?.find(i => i.show_in_carousel_slot4) || null,
      slot5: issues?.find(i => i.show_in_carousel_slot5) || null,
    }

    return NextResponse.json({
      success: true,
      data: carouselSlots
    })
  } catch (error: any) {
    console.error('Get carousel settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 캐러셀 설정 업데이트
export async function PUT(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 인증 확인
      await requireAdminAuth()

      // 요청 바디 파싱
      const { slot1, slot2, slot3, slot4, slot5 } = await req.json()

      // 모든 이슈의 캐러셀 슬롯 해제
      const { error: resetError } = await supabaseAdmin
        .from('issues')
        .update({
          show_in_carousel_slot1: false,
          show_in_carousel_slot2: false,
          show_in_carousel_slot3: false,
          show_in_carousel_slot4: false,
          show_in_carousel_slot5: false
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 업데이트

      if (resetError) {
        console.error('Reset carousel slots error:', resetError)
        return NextResponse.json(
          { error: 'Failed to reset carousel slots' },
          { status: 500 }
        )
      }

      // 각 슬롯 업데이트
      const slots = [
        { value: slot1, column: 'show_in_carousel_slot1', name: 'slot 1' },
        { value: slot2, column: 'show_in_carousel_slot2', name: 'slot 2' },
        { value: slot3, column: 'show_in_carousel_slot3', name: 'slot 3' },
        { value: slot4, column: 'show_in_carousel_slot4', name: 'slot 4' },
        { value: slot5, column: 'show_in_carousel_slot5', name: 'slot 5' }
      ]

      for (const slot of slots) {
        if (slot.value) {
          const { error: slotError } = await supabaseAdmin
            .from('issues')
            .update({ [slot.column]: true })
            .eq('id', slot.value)

          if (slotError) {
            console.error(`${slot.name} update error:`, slotError)
            return NextResponse.json(
              { error: `Failed to update ${slot.name}` },
              { status: 500 }
            )
          }
        }
      }

      // 메인 페이지 캐시 무효화
      revalidatePath('/')

      return NextResponse.json({
        success: true,
        message: 'Carousel display updated successfully'
      })

    } catch (error: any) {
      console.error('Carousel display update error:', error)
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
