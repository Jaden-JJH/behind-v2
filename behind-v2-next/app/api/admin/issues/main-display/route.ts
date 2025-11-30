import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withCsrfProtection } from '@/lib/api-helpers'

export async function PUT(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 인증 확인
      const cookieStore = await cookies()
      const authCookie = cookieStore.get('admin-auth')
      if (authCookie?.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // 2. 요청 바디 파싱
      const { hotSlot1, hotSlot2, pollSlot1, pollSlot2 } = await req.json()

      // 3. 모든 이슈의 메인 노출 해제
      const { error: resetError } = await supabaseAdmin
        .from('issues')
        .update({
          show_in_main_hot: false,
          show_in_main_poll: false
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 업데이트

      if (resetError) {
        console.error('Reset error:', resetError)
        return NextResponse.json(
          { error: 'Failed to reset main display' },
          { status: 500 }
        )
      }

      // 4. HOT 슬롯 업데이트
      const hotIds = [hotSlot1, hotSlot2].filter(Boolean)
      if (hotIds.length > 0) {
        const { error: hotError } = await supabaseAdmin
          .from('issues')
          .update({ show_in_main_hot: true })
          .in('id', hotIds)

        if (hotError) {
          console.error('HOT update error:', hotError)
          return NextResponse.json(
            { error: 'Failed to update HOT issues' },
            { status: 500 }
          )
        }
      }

      // 5. 투표 슬롯 업데이트
      const pollIds = [pollSlot1, pollSlot2].filter(Boolean)
      if (pollIds.length > 0) {
        const { error: pollError } = await supabaseAdmin
          .from('issues')
          .update({ show_in_main_poll: true })
          .in('id', pollIds)

        if (pollError) {
          console.error('Poll update error:', pollError)
          return NextResponse.json(
            { error: 'Failed to update poll issues' },
            { status: 500 }
          )
        }
      }

      // 6. 성공 응답
      return NextResponse.json({
        success: true,
        message: 'Main display updated successfully'
      })

    } catch (error: any) {
      console.error('Main display update error:', error)
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
