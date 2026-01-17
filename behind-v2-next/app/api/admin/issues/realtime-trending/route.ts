import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { withCsrfProtection } from '@/lib/api-helpers'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET(request: Request) {
  try {
    // 1. 인증 확인
    await requireAdminAuth()

    // 2. 설정 조회
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'realtime_trending')
      .single()

    if (error) {
      console.error('Get realtime trending error:', error)
      return NextResponse.json(
        { error: 'Failed to get realtime trending' },
        { status: 500 }
      )
    }

    // 3. 성공 응답
    return NextResponse.json({
      success: true,
      data: data?.value || {}
    })

  } catch (error: any) {
    console.error('Get realtime trending error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 인증 확인
      await requireAdminAuth()

      // 2. 요청 바디 파싱
      const body = await req.json()
      const { slot_1, slot_2, slot_3, slot_4, slot_5 } = body

      // 3. JSONB 업데이트
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .update({
          value: {
            slot_1,
            slot_2,
            slot_3,
            slot_4,
            slot_5
          },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'realtime_trending')

      if (error) {
        console.error('Update realtime trending error:', error)
        return NextResponse.json(
          { error: 'Failed to update realtime trending' },
          { status: 500 }
        )
      }

      // 4. 성공 응답
      return NextResponse.json({
        success: true,
        message: 'Realtime trending updated successfully'
      })

    } catch (error: any) {
      console.error('Update realtime trending error:', error)
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
