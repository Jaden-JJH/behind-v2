import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'
import { sanitizeHtml } from '@/lib/sanitize'
import { commentLimiter, getClientIp } from '@/lib/rate-limiter'
import { withCsrfProtection } from '@/lib/api-helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 댓글 조회 (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const issueId = searchParams.get('issueId')

    if (!issueId) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'issueId' })
    }

    // 댓글 조회 (최신순) - user 정보 JOIN
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (
          nickname
        )
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return createErrorResponse(ErrorCode.COMMENT_FETCH_FAILED, 500, error.message)
    }

    // 닉네임 매핑 (user_id가 있으면 users.nickname, 없으면 user_nick 사용)
    const mappedComments = comments.map(comment => ({
      ...comment,
      display_nickname: comment.user_id 
        ? (comment.users?.nickname || '익명') 
        : (comment.user_nick || '익명'),
      users: undefined // users 객체 제거
    }))

    return createSuccessResponse(mappedComments, 200, mappedComments.length)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}

// 댓글 작성 (POST) - 로그인 필수
export async function POST(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. 로그인 체크
      const supabaseServer = await createServerClient()
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
      
      if (authError || !user) {
        return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
      }

      // 2. 사용자 닉네임 조회
      const { data: userData, error: userError } = await supabaseServer
        .from('users')
        .select('nickname')
        .eq('id', user.id)
        .single()

      if (userError || !userData?.nickname) {
        return createErrorResponse(ErrorCode.UNAUTHORIZED, 401, { 
          message: '닉네임을 먼저 설정해주세요' 
        })
      }

      // 3. Rate Limiting
      const ip = getClientIp(req)
      const { success, limit, remaining, reset } = await commentLimiter.limit(ip)

      if (!success) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((reset - Date.now()) / 1000)
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          }
        )
      }

      const body = await req.json()
      const { issueId, body: commentBody } = body

      // XSS 방어: 입력 정제
      const sanitizedBody = sanitizeHtml(commentBody)

      // 입력 검증
      const missing = validateRequired({ issueId, body: sanitizedBody })
      if (missing.length > 0) {
        return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
      }

      // 댓글 길이 검증
      if (sanitizedBody.length < 2) {
        return createErrorResponse(ErrorCode.COMMENT_TOO_SHORT, 400)
      }
      if (sanitizedBody.length > 500) {
        return createErrorResponse(ErrorCode.COMMENT_TOO_LONG, 400)
      }

      // 댓글 작성 (user_id 포함, user_nick에도 닉네임 저장)
      const { data, error } = await supabase
        .from('comments')
        .insert({
          issue_id: issueId,
          body: sanitizedBody,
          user_id: user.id,
          user_nick: userData.nickname
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return createErrorResponse(ErrorCode.COMMENT_CREATE_FAILED, 500, error.message)
      }

      // 댓글 수 증가는 DB 트리거(increment_issue_comment_count)가 자동으로 처리함
      // 수동 업데이트 제거 - 이중 증가 버그 방지

      return createSuccessResponse({
        ...data,
        display_nickname: userData.nickname
      }, 201)
    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}
