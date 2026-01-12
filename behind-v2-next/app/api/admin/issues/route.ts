import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sanitizeFields, sanitizeHtml } from '@/lib/sanitize'
import { CATEGORY_EN_TO_KO, normalizeCategory, getEnglishCategory } from '@/lib/categories'
import { withCsrfProtection } from '@/lib/api-helpers'

let categoriesNormalized = false

async function ensureIssueCategoriesNormalized() {
  if (categoriesNormalized) return

  await Promise.all(
    Object.entries(CATEGORY_EN_TO_KO).map(([english, korean]) =>
      supabaseAdmin
        .from('issues')
        .update({ category: korean })
        .eq('category', english)
    )
  )

  categoriesNormalized = true
}

export async function GET(request: Request) {
  try {
    await ensureIssueCategoriesNormalized()

    // 1. 인증 확인
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 쿼리 파라미터 추출 및 기본값 설정
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const category = searchParams.get('category')
    const approval = searchParams.get('approval')
    const visibility = searchParams.get('visibility')
    const pageStr = searchParams.get('page') || '1'
    const limitStr = searchParams.get('limit') || '20'

    // 3. 페이지네이션 파라미터 검증
    const page = Math.max(1, parseInt(pageStr, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20))
    const offset = (page - 1) * limit

    // 4. sortBy 유효성 검증
    const validSortBy = ['created_at', 'view_count', 'comment_count']
    const finalSortBy = validSortBy.includes(sortBy) ? sortBy : 'created_at'

    // 5. order 유효성 검증
    const isAscending = order === 'asc'

    // 6. issues 테이블 기본 쿼리
    let query = supabaseAdmin
      .from('issues')
      .select(
        `id, display_id, title, category, approval_status, visibility, view_count, comment_count, show_in_main_hot, show_in_main_poll, is_blinded, blinded_at, report_count, created_at,
        poll:polls(
          id,
          question,
          is_blinded,
          blinded_at,
          report_count
        )`,
        { count: 'exact' }
      )

    // 7. 필터 적용
    if (category) {
      const normalizedCategory = normalizeCategory(category)
      const legacyEnglish = getEnglishCategory(normalizedCategory || undefined)

      if (normalizedCategory) {
        if (legacyEnglish) {
          query = query.in('category', [normalizedCategory, legacyEnglish])
        } else {
          query = query.eq('category', normalizedCategory)
        }
      }
    }
    if (approval) {
      query = query.eq('approval_status', approval)
    }
    if (visibility) {
      query = query.eq('visibility', visibility)
    }

    // 8. 정렬 적용
    query = query.order(finalSortBy, { ascending: isAscending })

    // 9. 페이지네이션 적용
    query = query.range(offset, offset + limit - 1)

    // 10. 쿼리 실행
    const { data: issues, error: issuesError, count: total } = await query

    if (issuesError) {
      console.error('Issues fetch error:', issuesError)
      return NextResponse.json(
        { error: issuesError.message || 'Failed to fetch issues' },
        { status: 500 }
      )
    }

    // 11. 각 이슈의 투표 수 조회
    let issuesWithVotes = (issues || []).map((issue) => ({
      ...issue,
      category: normalizeCategory(issue.category)
    }))

    if (issuesWithVotes.length > 0) {
      const issueIds = issuesWithVotes.map((issue) => issue.id)

      // polls 테이블에서 issue의 poll 데이터 조회
      const { data: polls, error: pollsError } = await supabaseAdmin
        .from('polls')
        .select('id, issue_id')
        .in('issue_id', issueIds)

      if (pollsError) {
        console.error('Polls fetch error:', pollsError)
        // polls 조회 실패해도 계속 진행
        issuesWithVotes = issuesWithVotes.map((issue) => ({
          ...issue,
          poll_votes_count: 0
        }))
      } else {
        const pollIds = polls?.map((p) => p.id) || []

        if (pollIds.length > 0) {
          // poll_votes에서 투표 수 조회
          const { data: voteData, error: voteError } = await supabaseAdmin
            .from('poll_votes')
            .select('poll_id')
            .in('poll_id', pollIds)

          if (voteError) {
            console.error('Poll votes fetch error:', voteError)
            // 투표 데이터 조회 실패해도 기본값으로 계속 진행
            issuesWithVotes = issuesWithVotes.map((issue) => ({
              ...issue,
              poll_votes_count: 0
            }))
          } else {
            // poll_id 기준으로 투표 수 카운트
            const voteCounts = new Map<string, number>()
            voteData?.forEach((vote) => {
              const pollId = vote.poll_id
              voteCounts.set(pollId, (voteCounts.get(pollId) || 0) + 1)
            })

            // polls 데이터로 issue_id -> poll_id 매핑
            const pollMap = new Map<string, string>()
            polls?.forEach((poll) => {
              pollMap.set(poll.issue_id, poll.id)
            })

            issuesWithVotes = issuesWithVotes.map((issue) => {
              const pollId = pollMap.get(issue.id)
              return {
                ...issue,
                poll_votes_count: pollId ? voteCounts.get(pollId) || 0 : 0
              }
            })
          }
        } else {
          // 투표가 없는 이슈들
          issuesWithVotes = issuesWithVotes.map((issue) => ({
            ...issue,
            poll_votes_count: 0
          }))
        }
      }
    }

    // 12. 응답
    return NextResponse.json({
      success: true,
      data: issuesWithVotes,
      total: total || 0,
      page
    })
  } catch (error: any) {
    console.error('Issues list error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch issues' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  return withCsrfProtection(request, async (req) => {
    // 인증 확인
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('admin-auth')
    if (authCookie?.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const {
      title,
      preview,
      thumbnail,
      capacity,
      category,
      summary,
      mediaYoutube,
      mediaNewsTitle,
      mediaNewsSource,
      mediaNewsUrl,
      behindStory,
      pollQuestion,
      options,
      showInMainHot,
      showInMainPoll
    } = await req.json()

  // XSS 방어: 텍스트 필드 정제
  const sanitized = sanitizeFields(
    {
      title,
      preview,
      summary,
      mediaNewsTitle,
      mediaNewsSource,
      behindStory,
      pollQuestion
    },
    ['title', 'preview', 'summary', 'mediaNewsTitle', 'mediaNewsSource', 'behindStory', 'pollQuestion']
  )

  // 투표 옵션도 정제
  const sanitizedOptions = options?.map((opt: string) => sanitizeHtml(opt))

  try {
    // 1. slug 생성 (제목을 URL-friendly하게 변환)
    const slug = sanitized.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    // 2. media_embed JSON 생성
    const mediaEmbed: any = {}
    if (mediaYoutube) {
      mediaEmbed.youtube = mediaYoutube
    }
    if (sanitized.mediaNewsTitle && mediaNewsUrl) {
      mediaEmbed.news = {
        title: sanitized.mediaNewsTitle,
        source: sanitized.mediaNewsSource || '',
        url: mediaNewsUrl
      }
    }

    // 3. 이슈 생성
    const { data: issue, error: issueError } = await supabaseAdmin
      .from('issues')
      .insert({
        slug,
        title: sanitized.title,
        preview: sanitized.preview,
        summary: sanitized.summary || null,
        thumbnail: thumbnail || null,
        capacity,
        category: normalizeCategory(category) || '일반',
        approval_status: 'pending',
        visibility: 'paused',
        media_embed: Object.keys(mediaEmbed).length > 0 ? mediaEmbed : null,
        behind_story: sanitized.behindStory || null,
        show_in_main_hot: showInMainHot || false,
        show_in_main_poll: showInMainPoll || false
      })
      .select()
      .single()

    if (issueError) throw issueError

    // 4. 투표 생성 (선택 사항)
    if (sanitized.pollQuestion && sanitizedOptions && sanitizedOptions.length >= 2) {
      const { data: poll, error: pollError } = await supabaseAdmin
        .from('polls')
        .insert({
          issue_id: issue.id,
          question: sanitized.pollQuestion
        })
        .select()
        .single()

      if (pollError) throw pollError

      // 5. 투표 옵션 생성
      const { error: optionsError } = await supabaseAdmin
        .from('poll_options')
        .insert(
          sanitizedOptions.map((text: string) => ({
            poll_id: poll.id,
            label: text
          }))
        )

      if (optionsError) throw optionsError
    }

    // 6. 채팅방 생성
    const { error: roomError } = await supabaseAdmin
      .from('rooms')
      .insert({
        issue_id: issue.id,
        capacity
      })

    if (roomError) throw roomError

    return NextResponse.json({
      success: true,
      issue,
      message: '이슈가 성공적으로 등록되었습니다'
    })

  } catch (error: any) {
    console.error('Issue creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create issue' },
      { status: 500 }
    )
  }
  })
}
