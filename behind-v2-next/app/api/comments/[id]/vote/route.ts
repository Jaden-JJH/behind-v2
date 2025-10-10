import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id
    const { voteType, deviceHash } = await request.json()

    // 입력 검증
    if (!voteType || !deviceHash) {
      return NextResponse.json(
        { error: 'Missing required fields: voteType, deviceHash' },
        { status: 400 }
      )
    }

    if (!['up', 'down'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid voteType. Must be "up" or "down"' },
        { status: 400 }
      )
    }

    // 1. 기존 투표 확인
    const { data: existingVote } = await supabase
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('device_hash', deviceHash)
      .single()

    if (existingVote) {
      // 이미 투표한 경우
      if (existingVote.vote_type === voteType) {
        // 같은 타입으로 재투표 시도 -> 에러
        return NextResponse.json(
          { error: 'Already voted' },
          { status: 409 }
        )
      } else {
        // 다른 타입으로 변경 시도 -> 기존 투표 삭제하고 새로 추가
        // 기존 카운트 감소
        const oldField = existingVote.vote_type === 'up' ? 'up' : 'down'
        await supabase.rpc('decrement_comment_vote', {
          p_comment_id: commentId,
          p_field: oldField
        })

        // 기존 투표 삭제
        await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('device_hash', deviceHash)
      }
    }

    // 2. 새 투표 기록
    const { error: voteError } = await supabase
      .from('comment_votes')
      .insert({
        comment_id: commentId,
        device_hash: deviceHash,
        vote_type: voteType
      })

    if (voteError) {
      console.error('Vote insert error:', voteError)
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      )
    }

    // 3. 댓글 카운트 업데이트
    const field = voteType === 'up' ? 'up' : 'down'
    const { error: updateError } = await supabase.rpc('increment_comment_vote', {
      p_comment_id: commentId,
      p_field: field
    })

    if (updateError) {
      console.error('Count update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update count' },
        { status: 500 }
      )
    }

    // 4. 업데이트된 댓글 데이터 반환
    const { data: updatedComment } = await supabase
      .from('comments')
      .select('up, down')
      .eq('id', commentId)
      .single()

    return NextResponse.json({
      success: true,
      data: updatedComment
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
