import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired, handleSupabaseError } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCsrfProtection(request, async (req) => {
    try {
      const { id: commentId } = await params
      const { voteType, deviceHash } = await req.json()

      // 입력 검증
      if (!commentId) {
       return createErrorResponse(ErrorCode.INVALID_REQUEST, 400, { missing: ['commentId'] })
      }

      const missing = validateRequired({ voteType, deviceHash })
      if (missing.length > 0) {
        return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
      }

      if (voteType !== 'up' && voteType !== 'down') {
        return createErrorResponse(ErrorCode.INVALID_OPTION, 400)
      }

      // 1. 기존 투표 확인
      const { data: existingVote, error: selErr } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('device_hash', deviceHash)
        .maybeSingle()
      if (selErr) return handleSupabaseError(selErr, 'select comment_votes')
      // existingVote가 null이면 투표 기록 없음
    // 2) 분기 처리
      if (existingVote && existingVote.vote_type === voteType) {
        // 같은 버튼 재클릭 → 취소: 레코드 삭제 후 카운트 -1
        const { error: delErr } = await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('device_hash', deviceHash)

        if (delErr) return handleSupabaseError(delErr, 'delete comment_votes')

        const { error: decErr } = await supabase.rpc('decrement_comment_vote', {
          p_comment_id: commentId,
          p_field: voteType,
        })
        if (decErr) return handleSupabaseError(decErr, 'decrement_comment_vote')
      } else if (existingVote && existingVote.vote_type !== voteType) {
        // 다른 버튼 클릭 → 변경: 기존 카운트 -1, 행 업데이트, 새 카운트 +1
        const { error: decErr } = await supabase.rpc('decrement_comment_vote', {
          p_comment_id: commentId,
          p_field: existingVote.vote_type,
        })
        if (decErr) return handleSupabaseError(decErr, 'decrement_comment_vote(prev)')

        const { error: updErr } = await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('comment_id', commentId)
          .eq('device_hash', deviceHash)

        if (updErr) return handleSupabaseError(updErr, 'update comment_votes')

        const { error: incErr } = await supabase.rpc('increment_comment_vote', {
          p_comment_id: commentId,
          p_field: voteType,
        })
        if (incErr) return handleSupabaseError(incErr, 'increment_comment_vote')
      } else {
        // 신규 투표: 레코드 삽입(유니크 충돌 시 409), 카운트 +1
        const { error: insErr } = await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            device_hash: deviceHash,
            vote_type: voteType,
          })
        if (insErr) return handleSupabaseError(insErr, 'insert comment_votes')

        const { error: incErr } = await supabase.rpc('increment_comment_vote', {
          p_comment_id: commentId,
          p_field: voteType,
        })
        if (incErr) return handleSupabaseError(incErr, 'increment_comment_vote')
      }

      // 3) 최종 카운트 반환 (서버가 단일 소스)
      const { data: comment, error: getErr } = await supabase
        .from('comments')
        .select('up, down')
        .eq('id', commentId)
        .single()
      if (getErr) return handleSupabaseError(getErr, 'select comments')

      return createSuccessResponse(comment)
    } catch (error: any) {
      console.error('Vote API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error?.message)
    }
  })
}