import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'
import {
  ChatServiceError,
  ChatServiceErrorCode,
  joinChatRoom,
  mapChatServiceErrorToApiError,
  ensureChatRoomState
} from '@/lib/chat-service'
import { chatJoinLimiter, getClientIp } from '@/lib/rate-limiter'

function mergeMembershipWithState(base: any, membership: any) {
  return {
    ...membership,
    roomId: membership.roomId ?? base?.roomId ?? '',
    issueId: membership.issueId ?? base?.issueId ?? '',
    capacity:
      typeof membership.capacity === 'number'
        ? membership.capacity
        : typeof base?.capacity === 'number'
          ? base.capacity
          : 0,
    activeMembers:
      typeof membership.activeMembers === 'number'
        ? membership.activeMembers
        : typeof base?.activeMembers === 'number'
          ? base.activeMembers
          : 0,
    lastMessageAt: membership.lastMessageAt ?? base?.lastMessageAt ?? null,
    issueTitle: membership.issueTitle ?? base?.issueTitle ?? null,
    issueThumbnail: membership.issueThumbnail ?? base?.issueThumbnail ?? null,
    issuePreview: membership.issuePreview ?? base?.issuePreview ?? null
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ issueId: string }> }
) {
  return withCsrfProtection(request, async (req) => {
    const { issueId } = await context.params
    if (!issueId) {
      return createErrorResponse(ErrorCode.INVALID_REQUEST, 400, { field: 'issueId' })
    }

    const ip = getClientIp(req)
    const { success, limit, remaining, reset } = await chatJoinLimiter.limit(
      `${issueId}:${ip}`
    )

    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.CHAT_RATE_LIMITED,
            message: '채팅방 입장 시도가 너무 잦습니다. 잠시 후 다시 시도해주세요.'
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

    const body = await req.json().catch(() => null)

    const deviceHash = body?.deviceHash as string | undefined
    const nickname = body?.nickname as string | undefined
    const sessionId = body?.sessionId as string | undefined
    const userId = body?.userId as string | undefined | null

    if (!deviceHash) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'deviceHash' })
    }

    if (!nickname) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'nickname' })
    }

    if (!sessionId) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { field: 'sessionId' })
    }

    try {
      const baseState = await ensureChatRoomState(issueId)

      const membership = await joinChatRoom({
        issueId,
        deviceHash,
        nickname,
        sessionId,
        userId: userId ?? null
      })

      return createSuccessResponse(mergeMembershipWithState(baseState, membership))
    } catch (error) {
      if (error instanceof ChatServiceError) {
        if (error.code === ChatServiceErrorCode.ROOM_NOT_FOUND) {
          try {
            const recoveredState = await ensureChatRoomState(issueId)
            const membership = await joinChatRoom({
              issueId,
              deviceHash,
              nickname,
              sessionId,
              userId: userId ?? null
            })
            return createSuccessResponse(mergeMembershipWithState(recoveredState, membership))
          } catch (ensureError) {
            if (ensureError instanceof ChatServiceError) {
              const ensureCode = mapChatServiceErrorToApiError(
                ensureError,
                ErrorCode.CHAT_MEMBER_CONFLICT
              )

              let ensureStatus = 400
              if (ensureCode === ErrorCode.CHAT_ROOM_NOT_FOUND) ensureStatus = 404
              else if (ensureCode === ErrorCode.CHAT_ROOM_FULL) ensureStatus = 403
              else if (ensureCode === ErrorCode.CHAT_MEMBER_CONFLICT) ensureStatus = 409

              return createErrorResponse(ensureCode, ensureStatus)
            }

            console.error('chat join ensure error:', ensureError)
            return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
          }
        }

        const code = mapChatServiceErrorToApiError(error, ErrorCode.CHAT_MEMBER_CONFLICT)

        let status = 400
        if (code === ErrorCode.CHAT_ROOM_NOT_FOUND) status = 404
        else if (code === ErrorCode.CHAT_ROOM_FULL) status = 403
        else if (code === ErrorCode.CHAT_MEMBER_CONFLICT) status = 409

        return createErrorResponse(code, status)
      }

      console.error('chat join error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}
