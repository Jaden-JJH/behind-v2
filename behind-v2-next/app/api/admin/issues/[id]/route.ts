import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { sanitizeFields, sanitizeHtml } from '@/lib/sanitize'
import { withCsrfProtection } from '@/lib/api-helpers'

// Helper: 이슈 조회 공통 로직
async function fetchIssueWithPoll(id: string) {
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
      return { error: 'Issue not found', status: 404, issue: null }
    }
    throw issueError
  }

  if (!issue) {
    return { error: 'Issue not found', status: 404, issue: null }
  }

  // 투표 정보 처리
  const poll = issue.polls?.[0] ? {
    id: issue.polls[0].id,
    question: issue.polls[0].question,
    options: issue.polls[0].poll_options?.map((opt: any) => ({
      id: opt.id,
      label: opt.label,
      vote_count: opt.vote_count || 0
    })) || []
  } : null

  // poll_votes 카운트 조회
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

  const { polls, ...issueData } = issue

  return {
    error: null,
    status: 200,
    issue: {
      ...issueData,
      poll,
      poll_votes_count: pollVotesCount
    }
  }
}

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

    const result = await fetchIssueWithPoll(id)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.issue
    })
  } catch (error: any) {
    console.error('Admin issue detail error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 어드민 인증 확인
      const cookieStore = await cookies()
      const authCookie = cookieStore.get('admin-auth')
      if (authCookie?.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // 2. 경로 파라미터 추출
      const { id } = await params

      if (!id) {
        return NextResponse.json(
          { error: 'Issue ID is required' },
          { status: 400 }
        )
      }

      // 3. 요청 본문 파싱
      const {
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
        capacity,
        media_embed,
        poll
      } = await req.json()

      // 4. XSS 방어: 텍스트 필드 정제
      const sanitized = sanitizeFields(
        {
          title,
          preview,
          summary,
          behind_story,
          pollQuestion: poll?.question
        },
        ['title', 'preview', 'summary', 'behind_story', 'pollQuestion']
      )

      // 투표 옵션 정제
      const sanitizedPollOptions = poll?.options?.map((opt: string) => sanitizeHtml(opt))

      // 5. 필드 유효성 검증
      const validCategories = ['정치', '경제', '연예', 'IT/테크', '스포츠', '사회']
      const validApprovalStatus = ['pending', 'approved', 'rejected']
      const validVisibility = ['active', 'paused']

      // title 검증 (5-100자)
      if (title !== undefined) {
        if (typeof title !== 'string' || title.length < 5 || title.length > 100) {
          return NextResponse.json(
            { error: 'Title must be between 5 and 100 characters' },
            { status: 400 }
          )
        }
      }

      // category 검증
      if (category !== undefined) {
        if (!validCategories.includes(category)) {
          return NextResponse.json(
            { error: `Category must be one of: ${validCategories.join(', ')}` },
            { status: 400 }
          )
        }
      }

      // approval_status 검증
      if (approval_status !== undefined) {
        if (!validApprovalStatus.includes(approval_status)) {
          return NextResponse.json(
            { error: `Approval status must be one of: ${validApprovalStatus.join(', ')}` },
            { status: 400 }
          )
        }
      }

      // visibility 검증
      if (visibility !== undefined) {
        if (!validVisibility.includes(visibility)) {
          return NextResponse.json(
            { error: `Visibility must be one of: ${validVisibility.join(', ')}` },
            { status: 400 }
          )
        }
      }

      // preview 검증 (있으면 길이 제한)
      if (preview !== undefined && typeof preview === 'string' && preview.length > 200) {
        return NextResponse.json(
          { error: 'Preview must be less than 200 characters' },
          { status: 400 }
        )
      }

      // summary 검증
      if (summary !== undefined && typeof summary === 'string' && summary.length > 500) {
        return NextResponse.json(
          { error: 'Summary must be less than 500 characters' },
          { status: 400 }
        )
      }

      // behind_story 검증
      if (sanitized.behind_story !== undefined && typeof sanitized.behind_story === 'string' && sanitized.behind_story.length > 1000) {
        return NextResponse.json(
          { error: 'Behind story must be less than 1000 characters' },
          { status: 400 }
        )
      }

      // 6. 기존 이슈 조회
      const result = await fetchIssueWithPoll(id)

      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status }
        )
      }

      const existingIssue = result.issue

      // 7. [B] 중지 불가 검증: visibility 변경 시 메인 화면 노출 확인
      if (visibility === 'paused') {
        // 변경 전 값 체크
        const currentShowInMainHot = show_in_main_hot !== undefined ? show_in_main_hot : existingIssue.show_in_main_hot
        const currentShowInMainPoll = show_in_main_poll !== undefined ? show_in_main_poll : existingIssue.show_in_main_poll

        if (currentShowInMainHot || currentShowInMainPoll) {
          return NextResponse.json(
            { error: '메인 화면에 노출 중입니다. 먼저 노출 설정을 해제한 후 중지 가능합니다' },
            { status: 400 }
          )
        }
      }

      // 8. [A] 투표 수정 불가 검증
      const isEditingPoll = poll !== undefined
      if (isEditingPoll && existingIssue.poll_votes_count > 0) {
        return NextResponse.json(
          { error: '투표가 1개 이상 있으면 투표 옵션을 수정할 수 없습니다' },
          { status: 400 }
        )
      }

      // 9. 이슈 업데이트 데이터 구성
      const updateData: any = {}

      if (title !== undefined) updateData.title = sanitized.title
      if (preview !== undefined) updateData.preview = sanitized.preview
      if (summary !== undefined) updateData.summary = sanitized.summary
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail
      if (category !== undefined) updateData.category = category
      if (approval_status !== undefined) updateData.approval_status = approval_status
      if (visibility !== undefined) updateData.visibility = visibility
      if (show_in_main_hot !== undefined) updateData.show_in_main_hot = show_in_main_hot
      if (show_in_main_poll !== undefined) updateData.show_in_main_poll = show_in_main_poll
      if (sanitized.behind_story !== undefined) updateData.behind_story = sanitized.behind_story
      if (capacity !== undefined) updateData.capacity = capacity

      // media_embed 처리
      if (media_embed !== undefined) {
        const newMediaEmbed: any = {}
        if (media_embed.youtube) {
          newMediaEmbed.youtube = media_embed.youtube
        }
        if (media_embed.news?.title && media_embed.news?.url) {
          newMediaEmbed.news = {
            title: sanitizeHtml(media_embed.news.title),
            source: sanitizeHtml(media_embed.news.source || ''),
            url: media_embed.news.url
          }
        }
        updateData.media_embed = Object.keys(newMediaEmbed).length > 0 ? newMediaEmbed : null
      }

      // 10. 이슈 업데이트
      const { error: updateError } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // 11. 투표 처리 (poll_votes가 없을 때만)
      if (isEditingPoll && existingIssue.poll_votes_count === 0) {
        // 기존 poll 삭제
        if (existingIssue.poll?.id) {
          // poll_options 삭제 (cascade delete가 없으면 명시적으로)
          const { error: optionsDeleteError } = await supabase
            .from('poll_options')
            .delete()
            .eq('poll_id', existingIssue.poll.id)

          if (optionsDeleteError) throw optionsDeleteError

          // poll 삭제
          const { error: pollDeleteError } = await supabase
            .from('polls')
            .delete()
            .eq('id', existingIssue.poll.id)

          if (pollDeleteError) throw pollDeleteError
        }

        // 새 poll 생성
        if (sanitized.pollQuestion && sanitizedPollOptions && sanitizedPollOptions.length >= 2) {
          const { data: newPoll, error: pollCreateError } = await supabase
            .from('polls')
            .insert({
              issue_id: id,
              question: sanitized.pollQuestion
            })
            .select()
            .single()

          if (pollCreateError) throw pollCreateError

          // 새 poll_options 생성
          const { error: optionsCreateError } = await supabase
            .from('poll_options')
            .insert(
              sanitizedPollOptions.map((text: string) => ({
                poll_id: newPoll.id,
                label: text
              }))
            )

          if (optionsCreateError) throw optionsCreateError
        }
      }

      // 12. 업데이트된 이슈 조회 및 응답
      const updatedResult = await fetchIssueWithPoll(id)

      if (updatedResult.error) {
        return NextResponse.json(
          { error: updatedResult.error },
          { status: updatedResult.status }
        )
      }

      return NextResponse.json({
        success: true,
        data: updatedResult.issue
      })
    } catch (error: any) {
      console.error('Admin issue update error:', error)
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
