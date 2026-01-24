import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import {
  ChatServiceError,
  ensureChatRoomStates,
  getChatRoomStates,
  mapChatServiceErrorToApiError
} from '@/lib/chat-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const issueIdsParam = searchParams.get('issueIds') || ''
  const issueIds = issueIdsParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (issueIds.length === 0) {
    return createErrorResponse(ErrorCode.INVALID_REQUEST, 400, { field: 'issueIds' })
  }

  try {
    await ensureChatRoomStates(issueIds)

    const states = await getChatRoomStates(issueIds)
    return createSuccessResponse(states)
  } catch (error) {
    if (error instanceof ChatServiceError) {
      const code = mapChatServiceErrorToApiError(error, ErrorCode.CHAT_ROOM_NOT_FOUND)
      const status = code === ErrorCode.CHAT_ROOM_NOT_FOUND ? 404 : 400
      return createErrorResponse(code, status)
    }

    console.error('chat room states error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
