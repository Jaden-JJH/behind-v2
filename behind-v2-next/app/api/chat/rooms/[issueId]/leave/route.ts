import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'
import {
  ChatServiceError,
  leaveChatRoom,
  mapChatServiceErrorToApiError
} from '@/lib/chat-service'

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

    try {
      const state = await leaveChatRoom(memberId)
      return createSuccessResponse(state)
    } catch (error) {
      if (error instanceof ChatServiceError) {
        const code = mapChatServiceErrorToApiError(error, ErrorCode.CHAT_MEMBER_NOT_FOUND)
        const status = code === ErrorCode.CHAT_MEMBER_NOT_FOUND ? 404 : 400
        return createErrorResponse(code, status)
      }

      console.error('chat leave error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}
