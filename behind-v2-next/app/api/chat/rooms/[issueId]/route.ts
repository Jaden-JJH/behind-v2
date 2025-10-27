import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import {
  ChatServiceError,
  ensureChatRoomState,
  mapChatServiceErrorToApiError
} from '@/lib/chat-service'

export async function GET(
  _request: Request,
  context: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await context.params
    if (!issueId) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 400, { field: 'issueId' })
    }

    const state = await ensureChatRoomState(issueId)
    return createSuccessResponse(state)
  } catch (error) {
    if (error instanceof ChatServiceError) {
      const code = mapChatServiceErrorToApiError(error, ErrorCode.CHAT_ROOM_NOT_FOUND)
      const status = code === ErrorCode.CHAT_ROOM_NOT_FOUND ? 404 : 400
      return createErrorResponse(code, status)
    }

    console.error('chat room state error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
