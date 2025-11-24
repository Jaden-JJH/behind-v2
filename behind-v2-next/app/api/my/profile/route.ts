import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // 1. 로그인 체크
    const supabaseServer = await createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
    }

    // 2. 사용자 기본 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, nickname, created_at')
      .eq('id', user.id)
      .maybeSingle()

    if (userError) {
      console.error('User fetch error:', userError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, userError?.message)
    }

    // users 테이블에 없으면 Auth 정보로 기본 프로필 생성
    let profileEmail = userData?.email || user.email || ''
    let profileNickname = userData?.nickname || 'Guest'
    let profileCreatedAt = userData?.created_at || new Date().toISOString()

    // 3. 활동 통계 계산
    // 3-1. 투표 수
    const { count: voteCount, error: voteError } = await supabase
      .from('poll_votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 3-2. 댓글 수
    const { count: commentCount, error: commentError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 3-3. 궁금해요 수 (report_curious는 user_id가 없으므로 0으로 처리)
    // TODO: Phase 2에서 report_curious에 user_id 추가 필요
    const curiousCount = 0

    if (voteError) {
      console.error('Vote count error:', voteError)
    }
    if (commentError) {
      console.error('Comment count error:', commentError)
    }

    // 4. 응답 구성
    const profile = {
      email: profileEmail,
      nickname: profileNickname,
      created_at: profileCreatedAt,
      stats: {
        vote_count: voteCount || 0,
        comment_count: commentCount || 0,
        curious_count: curiousCount
      }
    }

    return createSuccessResponse(profile)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
