export interface ChatRoomState {
  roomId: string
  issueId: string
  capacity: number
  activeMembers: number
  lastMessageAt?: string | null
  issueTitle?: string | null
  issueThumbnail?: string | null
  issuePreview?: string | null
}

export interface ChatMembership extends ChatRoomState {
  memberId: string
  sessionId?: string
}

export interface ChatPresenceState {
  roomId: string
  memberId: string
  activeMembers: number
}

export interface ChatMessage {
  id: number
  memberId: string
  roomId: string
  authorNick: string
  body: string
  createdAt: string
}

export interface ChatMessageQuery {
  before?: string
  limit?: number
}

export const CHAT_MESSAGE_MAX_LENGTH = 500
export const CHAT_MESSAGE_DEFAULT_LIMIT = 50
