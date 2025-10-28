import type { PostgrestError } from '@supabase/supabase-js'
import { ErrorCode } from './api-error'
import {
  ChatMembership,
  ChatMessage,
  ChatMessageQuery,
  ChatPresenceState,
  ChatRoomState,
  CHAT_MESSAGE_DEFAULT_LIMIT,
  CHAT_MESSAGE_MAX_LENGTH
} from './chat-types'
import { supabaseAdmin } from './supabase-admin'

export enum ChatServiceErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  MEMBER_CONFLICT = 'MEMBER_CONFLICT',
  MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  UNKNOWN = 'UNKNOWN'
}

export class ChatServiceError extends Error {
  constructor(public code: ChatServiceErrorCode, message?: string) {
    super(message || code)
  }
}

interface ChatJoinParams {
  issueId: string
  deviceHash: string
  nickname: string
  sessionId: string
  userId?: string | null
}

function mapChatError(error: PostgrestError): ChatServiceError {
  const reason = [error.details, error.message, error.hint]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()

  if (reason.includes('ROOM_FULL')) {
    return new ChatServiceError(ChatServiceErrorCode.ROOM_FULL, error.message)
  }
  if (reason.includes('ROOM_NOT_FOUND')) {
    return new ChatServiceError(ChatServiceErrorCode.ROOM_NOT_FOUND, error.message)
  }
  if (reason.includes('MEMBER_CONFLICT') || reason.includes('DUPLICATE')) {
    return new ChatServiceError(ChatServiceErrorCode.MEMBER_CONFLICT, error.message)
  }
  if (reason.includes('MEMBER_NOT_FOUND') || reason.includes('NOT_FOUND')) {
    return new ChatServiceError(ChatServiceErrorCode.MEMBER_NOT_FOUND, error.message)
  }
  if (reason.includes('MESSAGE_TOO_LONG')) {
    return new ChatServiceError(ChatServiceErrorCode.MESSAGE_TOO_LONG, error.message)
  }

  return new ChatServiceError(ChatServiceErrorCode.UNKNOWN, error.message)
}

function parseRoomState(row: any, fallbackIssueId?: string): ChatRoomState {
  if (!row) {
    throw new ChatServiceError(ChatServiceErrorCode.ROOM_NOT_FOUND)
  }

  const issueId = row.issue_id ?? row.issueId ?? fallbackIssueId ?? ''
  const capacityValue =
    row.capacity ?? row.room_capacity ?? row.max_capacity ?? row.capacity_value ?? null
  const activeMembersValue =
    row.active_members ?? row.activeMembers ?? row.members_active ?? null

  const capacity =
    typeof capacityValue === 'number' ? capacityValue : Number(capacityValue ?? 0)
  const activeMembers =
    typeof activeMembersValue === 'number'
      ? activeMembersValue
      : Number(activeMembersValue ?? 0)

  return {
    roomId: row.room_id ?? row.id ?? '',
    issueId,
    capacity,
    activeMembers,
    lastMessageAt: row.last_message_at ?? null,
    issueTitle: row.issue_title ?? row.title ?? null,
    issueThumbnail: row.issue_thumbnail ?? row.thumbnail ?? null,
    issuePreview: row.issue_preview ?? row.preview ?? null
  }
}

function parseMembership(row: any, fallbackIssueId?: string): ChatMembership {
  const base = parseRoomState(row, fallbackIssueId)
  return {
    ...base,
    memberId: row.member_id ?? row.id ?? '',
    sessionId: row.session_id ?? undefined
  }
}

function parsePresence(row: any): ChatPresenceState {
  return {
    roomId: row.room_id ?? '',
    memberId: row.member_id ?? '',
    activeMembers: typeof row.active_members === 'number'
      ? row.active_members
      : Number(row.active_members ?? 0)
  }
}

function parseMessage(row: any): ChatMessage {
  if (!row) {
    throw new ChatServiceError(ChatServiceErrorCode.UNKNOWN, 'Empty message row')
  }

  return {
    id: typeof row.id === 'number' ? row.id : Number(row.id ?? 0),
    memberId: row.member_id ?? '',
    roomId: row.room_id ?? '',
    authorNick: row.author_nick ?? row.nickname ?? '',
    body: row.body ?? row.message ?? '',
    createdAt: row.created_at ?? new Date().toISOString()
  }
}

export async function getChatRoomState(issueId: string): Promise<ChatRoomState> {
  const { data, error } = await supabaseAdmin.rpc('chat_get_room_state', {
    p_issue_id: issueId
  })

  if (error) {
    throw mapChatError(error)
  }

  const row = Array.isArray(data) ? data[0] : data
  const state = parseRoomState(row, issueId)
  if (!state.issueId && issueId) {
    state.issueId = issueId
  }

  const needsMetadata =
    !state.issueId ||
    !state.issueTitle ||
    !state.issueThumbnail ||
    !state.issuePreview ||
    !state.capacity

  const metadataIssueId = state.issueId || issueId

  if (needsMetadata && metadataIssueId) {
    try {
      const issue = await fetchIssueForRoom(metadataIssueId)
      state.issueId = state.issueId || issue.id
      state.issueTitle = state.issueTitle ?? issue.title ?? null
      state.issueThumbnail = state.issueThumbnail ?? issue.thumbnail ?? null
      state.issuePreview = state.issuePreview ?? issue.preview ?? null
      if (!state.capacity && typeof issue.capacity === 'number') {
        state.capacity = issue.capacity
      }
    } catch (metadataError) {
      console.warn('Failed to hydrate chat room metadata:', metadataError)
    }
  }

  return state
}

export async function getChatRoomStates(issueIds: string[]): Promise<ChatRoomState[]> {
  if (issueIds.length === 0) return []

  const { data, error } = await supabaseAdmin.rpc('chat_get_room_states', {
    p_issue_ids: issueIds
  })

  if (error) {
    throw mapChatError(error)
  }

  const rows = Array.isArray(data) ? data : []
  return rows.map((row) => parseRoomState(row))
}

export async function joinChatRoom(params: ChatJoinParams): Promise<ChatMembership> {
  const { issueId, deviceHash, nickname, sessionId, userId } = params

  if (!nickname || nickname.trim().length === 0) {
    throw new ChatServiceError(ChatServiceErrorCode.UNKNOWN, 'Nickname is required')
  }

  const { data, error } = await supabaseAdmin.rpc('chat_join_room', {
    p_issue_id: issueId,
    p_device_hash: deviceHash,
    p_user_id: userId ?? null,
    p_nickname: nickname,
    p_session_id: sessionId
  })

  if (error) {
    console.error('chat_join_room RPC error', {
      issueId,
      deviceHash,
      sessionId,
      userId: userId ?? null,
      code: error.code,
      details: error.details,
      message: error.message,
      hint: error.hint
    })
    throw mapChatError(error)
  }

  const row = Array.isArray(data) ? data[0] : data
  const membership = parseMembership(row, issueId)
  if (!membership.issueId && issueId) {
    membership.issueId = issueId
  }
  return membership
}

export async function leaveChatRoom(memberId: string): Promise<ChatPresenceState> {
  const { data, error } = await supabaseAdmin.rpc('chat_leave_room', {
    p_member_id: memberId
  })

  if (error) {
    throw mapChatError(error)
  }

  const row = Array.isArray(data) ? data[0] : data
  return parsePresence(row)
}

export async function touchChatPresence(memberId: string): Promise<ChatPresenceState> {
  const { data, error } = await supabaseAdmin.rpc('chat_touch_presence', {
    p_member_id: memberId
  })

  if (error) {
    throw mapChatError(error)
  }

  const row = Array.isArray(data) ? data[0] : data
  return parsePresence(row)
}

export async function fetchChatMessages(
  roomId: string,
  options: ChatMessageQuery = {}
): Promise<ChatMessage[]> {
  const { before, limit } = options
  const { data, error } = await supabaseAdmin.rpc('chat_list_messages', {
    p_room_id: roomId,
    p_before: before ?? null,
    p_limit: limit ?? CHAT_MESSAGE_DEFAULT_LIMIT
  })

  if (error) {
    throw mapChatError(error)
  }

  const rows = Array.isArray(data) ? data : []
  return rows.map(parseMessage)
}

export async function sendChatMessage(memberId: string, body: string): Promise<ChatMessage> {
  if (!body || body.trim().length === 0) {
    throw new ChatServiceError(ChatServiceErrorCode.UNKNOWN, 'Message body is required')
  }

  if (body.length > CHAT_MESSAGE_MAX_LENGTH) {
    throw new ChatServiceError(ChatServiceErrorCode.MESSAGE_TOO_LONG)
  }

  const { data, error } = await supabaseAdmin.rpc('chat_send_message', {
    p_member_id: memberId,
    p_body: body
  })

  if (error) {
    throw mapChatError(error)
  }

  const row = Array.isArray(data) ? data[0] : data
  return parseMessage(row)
}

export function mapChatServiceErrorToApiError(
  error: ChatServiceError,
  fallback: ErrorCode = ErrorCode.CHAT_MESSAGE_FAILED
): ErrorCode {
  switch (error.code) {
    case ChatServiceErrorCode.ROOM_NOT_FOUND:
      return ErrorCode.CHAT_ROOM_NOT_FOUND
    case ChatServiceErrorCode.ROOM_FULL:
      return ErrorCode.CHAT_ROOM_FULL
    case ChatServiceErrorCode.MEMBER_CONFLICT:
      return ErrorCode.CHAT_MEMBER_CONFLICT
    case ChatServiceErrorCode.MEMBER_NOT_FOUND:
      return ErrorCode.CHAT_MEMBER_NOT_FOUND
    case ChatServiceErrorCode.MESSAGE_TOO_LONG:
      return ErrorCode.CHAT_MESSAGE_TOO_LONG
    default:
      return fallback
  }
}

async function fetchIssueForRoom(issueId: string): Promise<{
  id: string
  capacity: number | null
  title?: string | null
  thumbnail?: string | null
  preview?: string | null
}> {
  const { data, error } = await supabaseAdmin
    .from('issues')
    .select('id, capacity, title, thumbnail, preview')
    .eq('id', issueId)
    .single()

  if (error) {
    throw new ChatServiceError(ChatServiceErrorCode.ROOM_NOT_FOUND, error.message)
  }

  if (!data) {
    throw new ChatServiceError(ChatServiceErrorCode.ROOM_NOT_FOUND)
  }

  return data
}

async function ensureRoomRecord(issueId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('id')
    .eq('issue_id', issueId)
    .maybeSingle()

  if (error) {
    throw new ChatServiceError(ChatServiceErrorCode.UNKNOWN, error.message)
  }

  if (data) {
    return
  }

  const issue = await fetchIssueForRoom(issueId)
  const capacity = typeof issue.capacity === 'number' && issue.capacity > 0 ? issue.capacity : 30

  const { error: insertError } = await supabaseAdmin
    .from('rooms')
    .insert({
      issue_id: issueId,
      capacity
    })

  if (insertError && insertError.code !== '23505') {
    throw new ChatServiceError(ChatServiceErrorCode.UNKNOWN, insertError.message)
  }
}

export async function ensureChatRoomState(issueId: string): Promise<ChatRoomState> {
  await ensureRoomRecord(issueId)
  return getChatRoomState(issueId)
}

export async function ensureChatRoomStates(issueIds: string[]): Promise<void> {
  if (issueIds.length === 0) return
  await Promise.all(issueIds.map((issueId) => ensureRoomRecord(issueId).catch(() => undefined)))
}
