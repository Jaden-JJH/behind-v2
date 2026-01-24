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

    // 2. URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all' // all, active, ended
    const offset = (page - 1) * limit

    // 3. 내가 투표한 poll_id 목록 가져오기
    const { data: myVotes, error: votesError } = await supabaseServer
      .from('poll_votes')
      .select('poll_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (votesError) {
      console.error('Votes fetch error:', votesError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, votesError.message)
    }

    if (!myVotes || myVotes.length === 0) {
      return createSuccessResponse({
        votes: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    // 4. poll_id로 issues 정보 가져오기
    const pollIds = myVotes.map(v => v.poll_id)

    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('id, issue_id, question')
      .in('id', pollIds)

    if (pollsError) {
      console.error('Polls fetch error:', pollsError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, pollsError.message)
    }

    // 5. issue_id로 issues 정보 가져오기
    const issueIds = polls.map(p => p.issue_id)

    let issuesQuery = supabase
      .from('issues')
      .select('id, display_id, title, preview, thumbnail, status, created_at, comment_count')
      .in('id', issueIds)

    // 필터 적용
    if (filter === 'active') {
      issuesQuery = issuesQuery.eq('status', 'active')
    } else if (filter === 'ended') {
      issuesQuery = issuesQuery.eq('status', 'ended')
    }

    const { data: issues, error: issuesError } = await issuesQuery

    if (issuesError) {
      console.error('Issues fetch error:', issuesError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, issuesError.message)
    }

    // 6. 데이터 조합: 투표 시간 기준으로 정렬
    const votesWithIssues = myVotes
      .map(vote => {
        const poll = polls.find(p => p.id === vote.poll_id)
        if (!poll) return null

        const issue = issues.find(i => i.id === poll.issue_id)
        if (!issue) return null

        return {
          voted_at: vote.created_at,
          poll_question: poll.question,
          issue: {
            id: issue.id,
            display_id: issue.display_id,
            title: issue.title,
            preview: issue.preview,
            thumbnail: issue.thumbnail,
            status: issue.status,
            created_at: issue.created_at,
            comment_count: issue.comment_count
          }
        }
      })
      .filter(v => v !== null)

    // 7. 페이지네이션 적용
    const total = votesWithIssues.length
    const paginatedVotes = votesWithIssues.slice(offset, offset + limit)

    return createSuccessResponse({
      votes: paginatedVotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 200, total)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
