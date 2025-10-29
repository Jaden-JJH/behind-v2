import { apiClient } from './api-client'
import type {
  ChatMembership,
  ChatMessage,
  ChatMessageQuery,
  ChatPresenceState,
  ChatRoomState
} from './chat-types'

interface JoinPayload {
  deviceHash: string
  sessionId: string
  userId: string
}

export async function fetchChatRoomState(issueId: string): Promise<ChatRoomState> {
  const response = await apiClient<{ success: boolean; data: ChatRoomState }>(
    `/api/chat/rooms/${issueId}`
  )
  return response.data
}

export async function fetchChatRoomStates(issueIds: string[]): Promise<ChatRoomState[]> {
  if (issueIds.length === 0) {
    return []
  }

  const response = await apiClient<{ success: boolean; data: ChatRoomState[] }>(
    `/api/chat/rooms/states?issueIds=${issueIds.join(',')}`
  )
  return response.data
}

export async function joinChatRoom(issueId: string, payload: JoinPayload): Promise<ChatMembership> {
  const response = await apiClient<{ success: boolean; data: ChatMembership }>(
    `/api/chat/rooms/${issueId}/join`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
  return response.data
}

export async function leaveChatRoom(issueId: string, memberId: string): Promise<ChatPresenceState> {
  const response = await apiClient<{ success: boolean; data: ChatPresenceState }>(
    `/api/chat/rooms/${issueId}/leave`,
    {
      method: 'POST',
      body: JSON.stringify({ memberId })
    }
  )
  return response.data
}

export async function touchChatPresence(
  issueId: string,
  memberId: string
): Promise<ChatPresenceState> {
  const response = await apiClient<{ success: boolean; data: ChatPresenceState }>(
    `/api/chat/rooms/${issueId}/presence`,
    {
      method: 'POST',
      body: JSON.stringify({ memberId })
    }
  )
  return response.data
}

export async function fetchChatMessages(
  issueId: string,
  roomId: string,
  query: ChatMessageQuery = {}
): Promise<ChatMessage[]> {
  const params = new URLSearchParams()
  params.set('roomId', roomId)
  if (query.before) params.set('before', query.before)
  if (query.limit) params.set('limit', String(query.limit))

  const response = await apiClient<{ success: boolean; data: ChatMessage[] }>(
    `/api/chat/rooms/${issueId}/messages?${params.toString()}`
  )
  return response.data
}

export async function sendChatMessage(
  issueId: string,
  memberId: string,
  message: string
): Promise<ChatMessage> {
  const response = await apiClient<{ success: boolean; data: ChatMessage }>(
    `/api/chat/rooms/${issueId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ memberId, message })
    }
  )
  return response.data
}
