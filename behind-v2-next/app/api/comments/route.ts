import { NextResponse } from 'next/server' 
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'
import { sanitizeHtml } from '@/lib/sanitize'
import { commentLimiter, getClientIp } from '@/lib/rate-limiter'

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

    // 댓글 조회 (최신순)
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return createErrorResponse(ErrorCode.COMMENT_FETCH_FAILED, 500, error.message)
    }

    return createSuccessResponse(comments, 200, comments.length)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}

// 댓글 작성 (POST)
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
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
    
    const body = await request.json()
    const { issueId, body: commentBody, userNick } = body

    // XSS 방어: 입력 정제
    const sanitizedBody = sanitizeHtml(commentBody)
    const sanitizedNick = sanitizeHtml(userNick)

    // 입력 검증
    const missing = validateRequired({ issueId, body: sanitizedBody, userNick: sanitizedNick })
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

    // 닉네임 검증
    if (sanitizedNick.length < 2) {
      return createErrorResponse(ErrorCode.NICKNAME_TOO_SHORT, 400)
    }
    if (sanitizedNick.length > 20) {
      return createErrorResponse(ErrorCode.NICKNAME_TOO_LONG, 400)
    }

    // 댓글 작성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        issue_id: issueId,
        body: sanitizedBody,
        user_nick: sanitizedNick
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return createErrorResponse(ErrorCode.COMMENT_CREATE_FAILED, 500, error.message)
    }

    return createSuccessResponse(data, 201)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
