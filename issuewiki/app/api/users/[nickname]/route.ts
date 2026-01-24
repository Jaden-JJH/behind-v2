import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  try {
    const { nickname } = await params
    
    // 닉네임 디코딩
    const decodedNickname = decodeURIComponent(nickname)
    
    const supabaseServer = await createServerClient()
    
    // 1. 사용자 조회
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, nickname, created_at')
      .eq('nickname', decodedNickname)
      .maybeSingle()
    
    if (userError) {
      console.error('User fetch error:', userError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
    
    if (!userData) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }
    
    // 2. 활동 통계
    const { count: commentCount } = await supabaseServer
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.id)
    
    const { count: voteCount } = await supabaseServer
      .from('poll_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.id)
    
    // 3. 최근 댓글 3개
    const { data: recentComments } = await supabaseServer
      .from('comments')
      .select(`
        id,
        body,
        created_at,
        issue_id,
        issues:issue_id (
          id,
          display_id,
          title
        )
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(3)
    
    // 삭제된 이슈 필터링
    const validComments = (recentComments || []).filter(comment => comment.issues)
    
    // 4. 가입일 포맷 (YYYY년 M월)
    const joinDate = new Date(userData.created_at)
    const joined_at = `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월`
    
    // 5. 응답 구성
    return createSuccessResponse({
      nickname: userData.nickname,
      joined_at: joined_at,
      stats: {
        comment_count: commentCount || 0,
        vote_count: voteCount || 0
      },
      recent_comments: validComments
    })
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}