import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 숫자인지 확인
    const displayId = parseInt(id, 10)
    if (isNaN(displayId)) {
      return NextResponse.json(
        { error: '유효하지 않은 이슈 번호입니다' },
        { status: 404 }
      )
    }

    // display_id로 조회 (polls와 poll_options를 함께 조회)
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select(`
        id,
        display_id,
        slug,
        title,
        preview,
        thumbnail,
        media_embed,
        view_count,
        capacity,
        category,
        status,
        comment_count,
        created_at,
        summary,
        behind_story,
        polls (
          id,
          question,
          seed_total,
          batch_min,
          batch_max,
          poll_options (
            id,
            label,
            vote_count
          )
        )
      `)
      .eq('display_id', displayId)
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

    // Poll 데이터 처리 (polls는 배열로 반환되므로 첫 번째 요소 사용)
    const poll = issue.polls?.[0] ? {
      id: issue.polls[0].id,
      question: issue.polls[0].question,
      seed_total: issue.polls[0].seed_total,
      batch_min: issue.polls[0].batch_min,
      batch_max: issue.polls[0].batch_max,
      options: issue.polls[0].poll_options?.map((opt: any) => ({
        id: opt.id,
        label: opt.label,
        vote_count: opt.vote_count || 0
      })) || []
    } : null

    // polls 필드 제거하고 issue 반환
    const { polls, ...issueData } = issue

    return NextResponse.json({
      issue: issueData,
      poll
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
