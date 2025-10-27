import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'
import {
  ChatServiceError,
  fetchChatMessages,
  mapChatServiceErrorToApiError,
  sendChatMessage
} from '@/lib/chat-service'
import { chatSendLimiter } from '@/lib/rate-limiter'

export async function GET(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  const issueId = params.issueId
  if (!issueId) {
    return createErrorResponse(ErrorCode.INVALID_REQUEST, 400, { field: 'issueId' })
  }

  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get('roomId')
  const before = searchParams.get('before') || undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Number(limitParam) : undefined

  if (!roomId) {
    return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'roomId' })
  }

  try {
    const messages = await fetchChatMessages(roomId, { before, limit })
    return createSuccessResponse(messages)
  } catch (error) {
    if (error instanceof ChatServiceError) {
      const code = mapChatServiceErrorToApiError(error, ErrorCode.CHAT_MESSAGE_FAILED)
      const status = code === ErrorCode.CHAT_ROOM_NOT_FOUND ? 404 : 400
      return createErrorResponse(code, status)
    }

    console.error('chat messages fetch error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}

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
    const message = body?.message as string | undefined

    if (!memberId) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'memberId' })
    }

    if (!message) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'message' })
    }

    const { success, limit, remaining, reset } = await chatSendLimiter.limit(memberId)
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.CHAT_RATE_LIMITED,
            message: '메시지를 너무 빠르게 전송하고 있습니다. 잠시 후 다시 시도해주세요.'
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
      const saved = await sendChatMessage(memberId, message)
      return createSuccessResponse(saved)
    } catch (error) {
      if (error instanceof ChatServiceError) {
        const code = mapChatServiceErrorToApiError(error, ErrorCode.CHAT_MESSAGE_FAILED)
        let status = 400
        if (code === ErrorCode.CHAT_MEMBER_NOT_FOUND) status = 404
        if (code === ErrorCode.CHAT_ROOM_NOT_FOUND) status = 404
        return createErrorResponse(code, status)
      }

      console.error('chat message send error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}
