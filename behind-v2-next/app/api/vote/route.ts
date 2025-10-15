import { createClient } from '@supabase/supabase-js'
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

      // 입력 검증
      const missing = validateRequired({ pollId, optionId, deviceHash })
      if (missing.length > 0) {
        return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
      }

      // Supabase RPC 함수 호출
      const { data, error } = await supabase.rpc('vote_poll', {
        p_poll_id: pollId,
        p_option_id: optionId,
        p_device_hash: deviceHash
      })

      if (error) {
        // 중복 투표 처리
        if (error.message.includes('DUPLICATE_VOTE')) {
          return createErrorResponse(ErrorCode.DUPLICATE_VOTE, 409)
        }

        // 잘못된 옵션 처리
        if (error.message.includes('INVALID_OPTION')) {
          return createErrorResponse(ErrorCode.INVALID_OPTION, 404)
        }

        console.error('Vote error:', error)
        return createErrorResponse(ErrorCode.VOTE_FAILED, 500, error.message)
      }

      return createSuccessResponse(data)
    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  });
}
