import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'
import {
  ChatServiceError,
  mapChatServiceErrorToApiError,
  touchChatPresence
} from '@/lib/chat-service'
import { chatPresenceLimiter } from '@/lib/rate-limiter'

export async function POST(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  return withCsrfProtection(request, async (req) => {
    const issueId = params.issueId
    if (!issueId) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 400, { field: 'issueId' })
    }

    const body = await req.json().catch(() => null)
    const memberId = body?.memberId as string | undefined

    if (!memberId) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'memberId' })
    }

    const { success, limit, remaining, reset } = await chatPresenceLimiter.limit(memberId)
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.CHAT_RATE_LIMITED,
            message: '채팅방 상태 갱신 요청이 너무 잦습니다.'
          }
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      )
    }

    try {
      const state = await touchChatPresence(memberId)
      return createSuccessResponse(state)
    } catch (error) {
      if (error instanceof ChatServiceError) {
        const code = mapChatServiceErrorToApiError(error, ErrorCode.CHAT_MEMBER_NOT_FOUND)
        const status = code === ErrorCode.CHAT_MEMBER_NOT_FOUND ? 404 : 400
        return createErrorResponse(code, status)
      }

      console.error('chat presence error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}
