import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withCsrfProtection } from '@/lib/api-helpers'

// GET: 현재 배너 설정 조회
export async function GET() {
  try {
    // 인증 확인
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 배너 슬롯이 활성화된 이슈 조회
    const { data: issues, error } = await supabaseAdmin
      .from('issues')
      .select('id, display_id, title, show_in_banner_slot1, show_in_banner_slot2, show_in_banner_slot3, status')
      .or('show_in_banner_slot1.eq.true,show_in_banner_slot2.eq.true,show_in_banner_slot3.eq.true')

    if (error) {
      console.error('Failed to fetch banner issues:', error)
      return NextResponse.json({ error: 'Failed to fetch banner issues' }, { status: 500 })
    }

    // 슬롯별로 정리
    const bannerSlots = {
      slot1: issues?.find(i => i.show_in_banner_slot1) || null,
      slot2: issues?.find(i => i.show_in_banner_slot2) || null,
      slot3: issues?.find(i => i.show_in_banner_slot3) || null,
    }

    return NextResponse.json({
      success: true,
      data: bannerSlots
    })
  } catch (error: any) {
    console.error('Get banner settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 배너 설정 업데이트
export async function PUT(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 인증 확인
      const cookieStore = await cookies()
      const authCookie = cookieStore.get('admin-auth')
      if (authCookie?.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // 요청 바디 파싱
      const { slot1, slot2, slot3 } = await req.json()

      // 모든 이슈의 배너 슬롯 해제
      const { error: resetError } = await supabaseAdmin
        .from('issues')
        .update({
          show_in_banner_slot1: false,
          show_in_banner_slot2: false,
          show_in_banner_slot3: false
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 업데이트

      if (resetError) {
        console.error('Reset banner slots error:', resetError)
        return NextResponse.json(
          { error: 'Failed to reset banner slots' },
          { status: 500 }
        )
      }

      // 슬롯 1 업데이트
      if (slot1) {
        const { error: slot1Error } = await supabaseAdmin
          .from('issues')
          .update({ show_in_banner_slot1: true })
          .eq('id', slot1)

        if (slot1Error) {
          console.error('Slot 1 update error:', slot1Error)
          return NextResponse.json(
            { error: 'Failed to update slot 1' },
            { status: 500 }
          )
        }
      }

      // 슬롯 2 업데이트
      if (slot2) {
        const { error: slot2Error } = await supabaseAdmin
          .from('issues')
          .update({ show_in_banner_slot2: true })
          .eq('id', slot2)

        if (slot2Error) {
          console.error('Slot 2 update error:', slot2Error)
          return NextResponse.json(
            { error: 'Failed to update slot 2' },
            { status: 500 }
          )
        }
      }

      // 슬롯 3 업데이트
      if (slot3) {
        const { error: slot3Error } = await supabaseAdmin
          .from('issues')
          .update({ show_in_banner_slot3: true })
          .eq('id', slot3)

        if (slot3Error) {
          console.error('Slot 3 update error:', slot3Error)
          return NextResponse.json(
            { error: 'Failed to update slot 3' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Banner display updated successfully'
      })

    } catch (error: any) {
      console.error('Banner display update error:', error)
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
