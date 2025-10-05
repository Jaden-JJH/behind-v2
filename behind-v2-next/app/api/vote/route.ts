import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pollId, optionId, deviceHash } = body

    // 입력 검증
    if (!pollId || !optionId || !deviceHash) {
      return NextResponse.json(
        { error: 'Missing required fields: pollId, optionId, deviceHash' },
        { status: 400 }
      )
    }

    // Supabase RPC 함수 호출
    const { data, error } = await supabase.rpc('vote_poll', {
      p_poll_id: pollId,
      p_option_id: optionId,
      p_device_hash: deviceHash
    })

    if (error) {
      // 중복 투표 처리
      if (error.message.includes('DUPLICATE_VOTE')) {
        return NextResponse.json(
          { error: 'Already voted', code: 'DUPLICATE_VOTE' },
          { status: 409 }
        )
      }
      
      // 잘못된 옵션 처리
      if (error.message.includes('INVALID_OPTION')) {
        return NextResponse.json(
          { error: 'Invalid poll option', code: 'INVALID_OPTION' },
          { status: 400 }
        )
      }

      console.error('Vote error:', error)
      return NextResponse.json(
        { error: 'Failed to vote' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
