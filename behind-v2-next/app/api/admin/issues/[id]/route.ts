import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sanitizeFields, sanitizeHtml } from '@/lib/sanitize'
import { normalizeCategory } from '@/lib/categories'
import { withCsrfProtection } from '@/lib/api-helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 인증 확인
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // 2. issues 테이블에서 id 기준 조회
    const { data: issue, error: issueError } = await supabaseAdmin
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

    const normalizedCategory = normalizeCategory(issue.category)
    if (normalizedCategory && normalizedCategory !== issue.category) {
      await supabaseAdmin
        .from('issues')
        .update({ category: normalizedCategory })
        .eq('id', issue.id)
      issue.category = normalizedCategory
    }

    // 3. polls 테이블에서 해당 이슈의 투표 조회 (poll_options 포함)
    const { data: poll, error: pollError } = await supabaseAdmin
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 인증 확인
      const cookieStore = await cookies()
      const authCookie = cookieStore.get('admin-auth')
      if (authCookie?.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id } = await params
      const {
        title,
        preview,
        summary,
        thumbnail,
        category,
        approval_status,
        visibility,
        capacity,
        media_embed,
        behind_story,
        show_in_main_hot,
        show_in_main_poll,
        poll
      } = await req.json()

      console.log('PUT /api/admin/issues/[id] - poll data:', poll)

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

      // poll 데이터 정제
      let sanitizedPoll = null
      if (poll?.question && poll?.options && poll.options.length > 0) {
        sanitizedPoll = {
          question: sanitizeHtml(poll.question),
          options: poll.options.map((opt: string) => sanitizeHtml(opt))
        }
      }

      // 3. 기존 이슈 조회
      const { data: existingIssue, error: fetchError } = await supabaseAdmin
        .from('issues')
        .select('id, show_in_main_hot, show_in_main_poll, visibility, is_blinded')
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

      // 3-1. 투표 블라인드 여부 확인
      const { data: existingPollForBlindCheck } = await supabaseAdmin
        .from('polls')
        .select('is_blinded')
        .eq('issue_id', id)
        .single()

      const isPollBlinded = existingPollForBlindCheck?.is_blinded || false

      // 4. visibility 변경 검증: 중지(paused)로 변경 시 메인 노출 확인
      // 단, 블라인드 처리된 경우는 예외 (이미 화면에서 필터링되므로)
      if (visibility === 'paused' && existingIssue.visibility === 'active') {
        const isBlinded = existingIssue.is_blinded || isPollBlinded
        if (!isBlinded && (existingIssue.show_in_main_hot || existingIssue.show_in_main_poll)) {
          return NextResponse.json(
            { error: '메인 화면에 노출 중입니다. 먼저 노출 설정을 해제한 후 중지 가능합니다' },
            { status: 400 }
          )
        }
      }

      // 5. 투표 수 확인 (poll_votes 테이블에서 실제 투표 수 확인)
      const { data: existingPoll, error: pollError } = await supabaseAdmin
        .from('polls')
        .select('id, question, poll_options(id, label)')
        .eq('issue_id', id)
        .single()

      let pollVotesCount = 0
      if (existingPoll && !pollError) {
        const { data: voteRecords, error: votesError } = await supabaseAdmin
          .from('poll_votes')
          .select('id')
          .eq('poll_id', existingPoll.id)

        if (!votesError && voteRecords) {
          pollVotesCount = voteRecords.length
        }
      }

      // 6. 투표 옵션 변경 여부 확인
      let pollOptionsChanged = false
      if (sanitizedPoll && existingPoll && !pollError) {
        try {
          // 기존 옵션 라벨 배열
          const existingOptions = existingPoll.poll_options
          const existingLabels = Array.isArray(existingOptions)
            ? existingOptions.map((opt: any) => opt.label).sort()
            : []

          // 새로운 옵션 라벨 배열
          const newLabels = Array.isArray(sanitizedPoll.options)
            ? [...sanitizedPoll.options].sort()
            : []

          // 질문이 변경되었거나 옵션 개수가 다르거나 옵션 내용이 다른 경우
          if (
            existingPoll.question !== sanitizedPoll.question ||
            existingLabels.length !== newLabels.length ||
            existingLabels.some((label: string, idx: number) => label !== newLabels[idx])
          ) {
            pollOptionsChanged = true
          }
        } catch (err) {
          console.error('Poll comparison error:', err)
          // 비교 중 에러 발생 시 변경된 것으로 간주
          pollOptionsChanged = true
        }
      }

      // 7. 투표 수정 불가 검증
      // 임시로 주석 처리 - 데이터 정리 후 다시 활성화 예정
      // if (pollOptionsChanged && pollVotesCount > 0) {
      //   return NextResponse.json(
      //     { error: '투표가 1개 이상 있어 투표 옵션을 수정할 수 없습니다' },
      //     { status: 400 }
      //   )
      // }

      // 8. 투표 수정 처리
      if (sanitizedPoll) {
        console.log('sanitizedPoll:', JSON.stringify(sanitizedPoll))
        if (existingPoll) {
          console.log('Existing poll found, updating...')
          // 기존 투표가 있으면 항상 수정 (임시: 데이터 정리를 위해 조건 제거)
          console.log('Deleting existing poll votes for poll_id:', existingPoll.id)
          const { error: deleteVotesError } = await supabaseAdmin
            .from('poll_votes')
            .delete()
            .eq('poll_id', existingPoll.id)

          if (deleteVotesError) {
            console.error('Poll votes delete error:', deleteVotesError)
            return NextResponse.json(
              { error: `Poll votes delete failed: ${deleteVotesError.message}` },
              { status: 500 }
            )
          }
          pollVotesCount = 0

          // 기존 poll_options 삭제
          console.log('Deleting old poll options for poll_id:', existingPoll.id)
          const { error: deleteOptionsError } = await supabaseAdmin
            .from('poll_options')
            .delete()
            .eq('poll_id', existingPoll.id)

          if (deleteOptionsError) {
            console.error('Poll options delete error:', deleteOptionsError)
            return NextResponse.json(
              { error: `Poll options delete failed: ${deleteOptionsError.message}` },
              { status: 500 }
            )
          }
          console.log('Old poll options deleted successfully')

          // poll 질문 업데이트
          console.log('Updating poll question to:', sanitizedPoll.question)
          const { error: updatePollError } = await supabaseAdmin
            .from('polls')
            .update({ question: sanitizedPoll.question })
            .eq('id', existingPoll.id)

          if (updatePollError) {
            console.error('Poll update error:', updatePollError)
            return NextResponse.json(
              { error: `Poll update failed: ${updatePollError.message}` },
              { status: 500 }
            )
          }
          console.log('Poll question updated successfully')

          // 새 옵션 생성
          console.log('Inserting new poll options:', sanitizedPoll.options)
          if (sanitizedPoll.options && sanitizedPoll.options.length > 0) {
            const optionsToInsert = sanitizedPoll.options.map((label: string) => ({
              poll_id: existingPoll.id,
              label
            }))
            console.log('Options to insert:', JSON.stringify(optionsToInsert))

            const { error: insertOptionsError } = await supabaseAdmin
              .from('poll_options')
              .insert(optionsToInsert)

            if (insertOptionsError) {
              console.error('Poll options insert error:', insertOptionsError)
              return NextResponse.json(
                { error: `Poll options insert failed: ${insertOptionsError.message}` },
                { status: 500 }
              )
            }
            console.log('New poll options inserted successfully')
          } else {
            console.error('Attempted to insert empty poll options array. sanitizedPoll:', sanitizedPoll)
            return NextResponse.json(
              { error: 'Poll options cannot be empty' },
              { status: 400 }
            )
          }
        } else {
          // 투표가 없으면 새로 생성
          const { data: newPoll, error: newPollError } = await supabaseAdmin
            .from('polls')
            .insert({
              issue_id: id,
              question: sanitizedPoll.question
            })
            .select()
            .single()

          if (newPollError) {
            console.error('Poll creation error:', newPollError)
            return NextResponse.json(
              { error: newPollError.message || 'Failed to create poll' },
              { status: 500 }
            )
          }

          // 옵션 생성
          const { error: newOptionsError } = await supabaseAdmin
            .from('poll_options')
            .insert(
              sanitizedPoll.options.map((label: string) => ({
                poll_id: newPoll.id,
                label
              }))
            )

          if (newOptionsError) {
            console.error('New poll options insert error:', newOptionsError)
            return NextResponse.json(
              { error: newOptionsError.message || 'Failed to create poll options' },
              { status: 500 }
            )
          }
        }
      }

      // 9. 이슈 업데이트
      console.log('About to update issue with id:', id)
      const updateData: any = {
        title: sanitized.title,
        preview: sanitized.preview,
        summary: sanitized.summary || null,
        thumbnail: thumbnail || null,
        media_embed: sanitizedMediaEmbed || null,
        behind_story: sanitized.behind_story || null,
        show_in_main_hot: show_in_main_hot !== undefined ? show_in_main_hot : existingIssue.show_in_main_hot,
        show_in_main_poll: show_in_main_poll !== undefined ? show_in_main_poll : existingIssue.show_in_main_poll
      }

      // 선택적 필드 추가
      if (category !== undefined) {
        const normalizedCategory = normalizeCategory(category)
        updateData.category = normalizedCategory || null
      }
      if (approval_status !== undefined) updateData.approval_status = approval_status
      if (visibility !== undefined) updateData.visibility = visibility
      if (capacity !== undefined) updateData.capacity = capacity

      console.log('Update data:', JSON.stringify(updateData, null, 2))
      const { data: updatedIssue, error: updateError } = await supabaseAdmin
        .from('issues')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      console.log('Update result - data:', updatedIssue, 'error:', updateError)

      if (updateError) {
        console.error('Issue update error:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update issue' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: updatedIssue,
        message: '이슈가 성공적으로 수정되었습니다'
      })
    } catch (error: any) {
      console.error('================== Issue update error ==================')
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('Full error:', JSON.stringify(error, null, 2))
      console.error('========================================================')
      return NextResponse.json(
        { error: error.message || 'Failed to update issue' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 인증 확인
      const cookieStore = await cookies()
      const authCookie = cookieStore.get('admin-auth')
      if (authCookie?.value !== 'true') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { id } = await params

      // 2. 이슈 조회 및 삭제 가능 여부 확인
      const { data: issue, error: fetchError } = await supabaseAdmin
        .from('issues')
        .select('id, visibility, approval_status')
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

      // 삭제 조건: visibility가 'paused'이거나 approval_status가 'pending'이면 삭제 가능
      // 즉, visibility가 'active'이고 approval_status가 'pending'이 아니면 삭제 불가
      if (issue.visibility === 'active' && issue.approval_status !== 'pending') {
        return NextResponse.json(
          { error: '게시 중인 이슈는 삭제할 수 없습니다. 먼저 중지한 후 삭제 가능합니다' },
          { status: 400 }
        )
      }

      // 3. 연관 데이터 정리 (hard delete)
      // poll 조회
      const { data: polls, error: pollsFetchError } = await supabaseAdmin
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
        const { error: votesDeleteError } = await supabaseAdmin
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
        const { error: optionsDeleteError } = await supabaseAdmin
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
        const { error: pollsDeleteError } = await supabaseAdmin
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
      const { error: roomsDeleteError } = await supabaseAdmin
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
      const { error: commentsDeleteError } = await supabaseAdmin
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
      const { error: issueDeleteError } = await supabaseAdmin
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
