import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 어드민 인증 확인
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 경로 파라미터 추출 (UUID)
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Issue ID is required' },
        { status: 400 }
      )
    }

    // 3. UUID 기반으로 이슈 조회 (모든 필드 + polls 관계)
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select(`
        id,
        display_id,
        slug,
        title,
        preview,
        summary,
        thumbnail,
        category,
        approval_status,
        visibility,
        show_in_main_hot,
        show_in_main_poll,
        behind_story,
        media_embed,
        capacity,
        view_count,
        comment_count,
        created_at,
        polls (
          id,
          question,
          poll_options (
            id,
            label,
            vote_count
          )
        )
      `)
      .eq('id', id)
      .single()

    if (issueError) {
      if (issueError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Issue not found' },
          { status: 404 }
        )
      }
      throw issueError
    }

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      )
    }

    // 4. 투표 정보 처리
    const poll = issue.polls?.[0] ? {
      id: issue.polls[0].id,
      question: issue.polls[0].question,
      options: issue.polls[0].poll_options?.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        vote_count: opt.vote_count || 0
      })) || []
    } : null

    // 5. poll_votes 카운트 조회
    let pollVotesCount = 0
    if (poll?.id) {
      const { count, error: countError } = await supabase
        .from('poll_votes')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', poll.id)

      if (!countError) {
        pollVotesCount = count || 0
      }
    }

    // 6. 응답 데이터 구성
    const { polls, ...issueData } = issue

    return NextResponse.json({
      success: true,
      data: {
        ...issueData,
        poll,
        poll_votes_count: pollVotesCount
      }
    })
  } catch (error: any) {
    console.error('Admin issue detail error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
