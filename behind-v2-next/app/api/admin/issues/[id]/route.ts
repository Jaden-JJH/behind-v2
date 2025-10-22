import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { sanitizeFields, sanitizeHtml } from '@/lib/sanitize'
import { withCsrfProtection } from '@/lib/api-helpers'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // 1. 인증 확인
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = params.id

    // 2. issues 테이블에서 id 기준 조회
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()

    if (issueError) {
      console.error('Issue fetch error:', issueError)
      return NextResponse.json(
        { error: issueError.message || 'Failed to fetch issue' },
        { status: 500 }
      )
    }

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // 3. polls 테이블에서 해당 이슈의 투표 조회 (poll_options 포함)
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, question, poll_options(id, label, vote_count)')
      .eq('issue_id', id)
      .single()

    // poll이 없으면 null, 에러는 logs만
    if (pollError && pollError.code !== 'PGRST116') {
      console.error('Poll fetch error:', pollError)
    }

    // 4. poll_votes_count 계산 (poll_options 배열의 votes 합계)
    let poll_votes_count = 0
    if (poll && poll.poll_options && Array.isArray(poll.poll_options)) {
      poll_votes_count = poll.poll_options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0)
    }

    // 5. 응답
    return NextResponse.json({
      success: true,
      data: {
        ...issue,
        poll: poll || null,
        poll_votes_count
      }
    })
  } catch (error: any) {
    console.error('Issue detail error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch issue' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 인증 확인
      const cookieStore = await cookies()
      const authCookie = cookieStore.get('admin-auth')
      if (authCookie?.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const id = params.id
      const {
        title,
        preview,
        summary,
        thumbnail,
        media_embed,
        behind_story,
        show_in_main_hot,
        show_in_main_poll
      } = await req.json()

      // 2. XSS 방어: 텍스트 필드 정제
      const sanitized = sanitizeFields(
        {
          title,
          preview,
          summary,
          behind_story
        },
        ['title', 'preview', 'summary', 'behind_story']
      )

      // media_embed에서 news 필드의 텍스트도 정제
      let sanitizedMediaEmbed = media_embed
      if (media_embed?.news) {
        sanitizedMediaEmbed = {
          ...media_embed,
          news: {
            ...media_embed.news,
            title: sanitizeHtml(media_embed.news.title),
            source: sanitizeHtml(media_embed.news.source)
          }
        }
      }

      // 3. 기존 이슈 조회
      const { data: existingIssue, error: fetchError } = await supabase
        .from('issues')
        .select('id, show_in_main_hot, show_in_main_poll')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Issue fetch error:', fetchError)
        return NextResponse.json(
          { error: fetchError.message || 'Failed to fetch issue' },
          { status: 500 }
        )
      }

      if (!existingIssue) {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
      }

      // 4. 투표 수 확인
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select('id')
        .eq('issue_id', id)
        .single()

      let hasVotes = false
      if (poll) {
        const { data: votes, error: votesError } = await supabase
          .from('poll_options')
          .select('votes')
          .eq('poll_id', poll.id)

        if (!votesError && votes) {
          hasVotes = votes.some((opt) => (opt.votes || 0) >= 1)
        }
      }

      // 5. 투표 수정 불가 검증
      if (hasVotes) {
        // 투표가 있으면 show_in_main_poll을 변경할 수 없음
        if (show_in_main_poll !== existingIssue.show_in_main_poll) {
          return NextResponse.json(
            { error: 'Cannot modify poll settings when votes exist' },
            { status: 400 }
          )
        }
      }

      // 6. 이슈 업데이트
      const { data: updatedIssue, error: updateError } = await supabase
        .from('issues')
        .update({
          title: sanitized.title,
          preview: sanitized.preview,
          summary: sanitized.summary || null,
          thumbnail: thumbnail || null,
          media_embed: sanitizedMediaEmbed || null,
          behind_story: sanitized.behind_story || null,
          show_in_main_hot: show_in_main_hot !== undefined ? show_in_main_hot : existingIssue.show_in_main_hot,
          show_in_main_poll: show_in_main_poll !== undefined ? show_in_main_poll : existingIssue.show_in_main_poll
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Issue update error:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update issue' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        issue: updatedIssue,
        message: '이슈가 성공적으로 수정되었습니다'
      })
    } catch (error: any) {
      console.error('Issue update error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update issue' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 인증 확인
      const cookieStore = await cookies()
      const authCookie = cookieStore.get('admin-auth')
      if (authCookie?.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const id = params.id

      // 2. 이슈 조회 및 visibility 확인
      const { data: issue, error: fetchError } = await supabase
        .from('issues')
        .select('id, visibility')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Issue fetch error:', fetchError)
        return NextResponse.json(
          { error: fetchError.message || 'Failed to fetch issue' },
          { status: 500 }
        )
      }

      if (!issue) {
        return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
      }

      // visibility가 active인 경우 삭제 불가
      if (issue.visibility === 'active') {
        return NextResponse.json(
          { error: 'Cannot delete active issues' },
          { status: 400 }
        )
      }

      // 3. 연관 데이터 정리 (hard delete)
      // poll 조회
      const { data: polls, error: pollsFetchError } = await supabase
        .from('polls')
        .select('id')
        .eq('issue_id', id)

      if (pollsFetchError) {
        console.error('Polls fetch error:', pollsFetchError)
        return NextResponse.json(
          { error: pollsFetchError.message || 'Failed to fetch related polls' },
          { status: 500 }
        )
      }

      // poll이 있으면 poll_votes, poll_options 삭제
      if (polls && polls.length > 0) {
        const pollIds = polls.map((p) => p.id)

        // poll_votes 삭제
        const { error: votesDeleteError } = await supabase
          .from('poll_votes')
          .delete()
          .in('poll_id', pollIds)

        if (votesDeleteError) {
          console.error('Poll votes delete error:', votesDeleteError)
          return NextResponse.json(
            { error: votesDeleteError.message || 'Failed to delete poll votes' },
            { status: 500 }
          )
        }

        // poll_options 삭제
        const { error: optionsDeleteError } = await supabase
          .from('poll_options')
          .delete()
          .in('poll_id', pollIds)

        if (optionsDeleteError) {
          console.error('Poll options delete error:', optionsDeleteError)
          return NextResponse.json(
            { error: optionsDeleteError.message || 'Failed to delete poll options' },
            { status: 500 }
          )
        }

        // polls 삭제
        const { error: pollsDeleteError } = await supabase
          .from('polls')
          .delete()
          .in('id', pollIds)

        if (pollsDeleteError) {
          console.error('Polls delete error:', pollsDeleteError)
          return NextResponse.json(
            { error: pollsDeleteError.message || 'Failed to delete polls' },
            { status: 500 }
          )
        }
      }

      // rooms 삭제
      const { error: roomsDeleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('issue_id', id)

      if (roomsDeleteError) {
        console.error('Rooms delete error:', roomsDeleteError)
        return NextResponse.json(
          { error: roomsDeleteError.message || 'Failed to delete rooms' },
          { status: 500 }
        )
      }

      // comments 삭제
      const { error: commentsDeleteError } = await supabase
        .from('comments')
        .delete()
        .eq('issue_id', id)

      if (commentsDeleteError) {
        console.error('Comments delete error:', commentsDeleteError)
        return NextResponse.json(
          { error: commentsDeleteError.message || 'Failed to delete comments' },
          { status: 500 }
        )
      }

      // issues 삭제 (hard delete)
      const { error: issueDeleteError } = await supabase
        .from('issues')
        .delete()
        .eq('id', id)

      if (issueDeleteError) {
        console.error('Issue delete error:', issueDeleteError)
        return NextResponse.json(
          { error: issueDeleteError.message || 'Failed to delete issue' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '이슈가 성공적으로 삭제되었습니다'
      })
    } catch (error: any) {
      console.error('Issue delete error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete issue' },
        { status: 500 }
      )
    }
  })
}
