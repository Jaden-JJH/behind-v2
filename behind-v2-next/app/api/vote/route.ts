import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'
import { voteLimiter, getClientIp } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'
import { withCsrfProtection } from '@/lib/api-helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  return withCsrfProtection(request, async (req) => {
    try {
      // 1. Rate Limiting
      const ip = getClientIp(req)
      const { success, limit, remaining, reset } = await voteLimiter.limit(ip)

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
      const { pollId, optionId, deviceHash } = body

      // 2. 로그인 체크
      const supabaseServer = await createServerClient()
      const { data: { user } } = await supabaseServer.auth.getUser()

      // 3. 로그인 사용자 vs 비로그인 사용자 분기
      if (user) {
        // 로그인 사용자: user_id로 투표
        const missing = validateRequired({ pollId, optionId })
        if (missing.length > 0) {
          return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
        }

        const { data, error } = await supabase.rpc('vote_poll_authenticated', {
          p_poll_id: pollId,
          p_option_id: optionId,
          p_user_id: user.id
        })

        if (error) {
          if (error.message.includes('DUPLICATE_VOTE')) {
            return createErrorResponse(ErrorCode.DUPLICATE_VOTE, 409)
          }
          if (error.message.includes('INVALID_OPTION')) {
            return createErrorResponse(ErrorCode.INVALID_OPTION, 404)
          }
          console.error('Vote error (authenticated):', error)
          return createErrorResponse(ErrorCode.VOTE_FAILED, 500, error.message)
        }

        return createSuccessResponse(data)
      } else {
        // 비로그인 사용자: deviceHash로 투표 (기존 방식)
        const missing = validateRequired({ pollId, optionId, deviceHash })
        if (missing.length > 0) {
          return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
        }

        const { data, error } = await supabase.rpc('vote_poll', {
          p_poll_id: pollId,
          p_option_id: optionId,
          p_device_hash: deviceHash
        })

        if (error) {
          if (error.message.includes('DUPLICATE_VOTE')) {
            return createErrorResponse(ErrorCode.DUPLICATE_VOTE, 409)
          }
          if (error.message.includes('INVALID_OPTION')) {
            return createErrorResponse(ErrorCode.INVALID_OPTION, 404)
          }
          console.error('Vote error (anonymous):', error)
          return createErrorResponse(ErrorCode.VOTE_FAILED, 500, error.message)
        }

        return createSuccessResponse(data)
      }
    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  });
}
