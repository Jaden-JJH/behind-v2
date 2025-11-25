import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'

interface FollowedIssue {
  id: string
  display_id: number
  title: string
  preview: string
  thumbnail?: string
  status: string
  created_at: string
  comment_count: number
  follow_created_at: string
}

interface FollowsResponse {
  follows: FollowedIssue[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function GET(request: Request) {
  try {
    // 1. 로그인 체크
    const supabaseServer = await createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
    }

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all' // all, active, ended

    if (page < 1 || limit < 1 || limit > 100) {
      return createErrorResponse(ErrorCode.INVALID_PARAMS, 400, {
        message: 'Invalid page or limit'
      })
    }

    // 3. 모든 팔로우 조회 (issue_id 만 가져오기)
    const { data: allFollows, error: fetchError } = await supabaseServer
      .from('issue_follows')
      .select('id, issue_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch follows error:', fetchError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, fetchError.message)
    }

    // 조회된 팔로우 데이터가 없으면 빈 배열 반환
    if (!allFollows || allFollows.length === 0) {
      const response: FollowsResponse = {
        follows: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      }
      return createSuccessResponse(response, 200)
    }

    // 3-2. 해당하는 이슈들 조회
    const issueIds = allFollows.map(f => f.issue_id)
    const { data: issues, error: issuesError } = await supabaseServer
      .from('issues')
      .select('id, display_id, title, preview, thumbnail, status, created_at, comment_count')
      .in('id', issueIds)

    if (issuesError) {
      console.error('Fetch issues error:', issuesError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, issuesError.message)
    }

    // 4. 데이터 포맷팅 및 필터링 (메모리에서 조인)
    const issueMap = new Map(issues?.map(i => [i.id, i]) || [])

    const allFormattedFollows: FollowedIssue[] = (allFollows || [])
      .map((follow: any) => {
        const issue = issueMap.get(follow.issue_id)

        if (!issue) {
          return null
        }

        // 필터 적용
        if (filter === 'active' && issue.status !== 'active') {
          return null
        }
        if (filter === 'ended' && issue.status !== 'ended') {
          return null
        }

        return {
          id: issue.id,
          display_id: issue.display_id,
          title: issue.title,
          preview: issue.preview,
          thumbnail: issue.thumbnail,
          status: issue.status,
          created_at: issue.created_at,
          comment_count: issue.comment_count || 0,
          follow_created_at: follow.created_at
        }
      })
      .filter(Boolean) as FollowedIssue[]

    // 5. 페이지네이션
    const total = allFormattedFollows.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const follows = allFormattedFollows.slice(offset, offset + limit)

    // 6. 응답
    const response: FollowsResponse = {
      follows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }

    return createSuccessResponse(response, 200)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
