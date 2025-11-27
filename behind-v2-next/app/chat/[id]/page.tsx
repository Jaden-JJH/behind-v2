'use client'

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, MessageCircle, Users } from "lucide-react"
import {
  fetchChatMessages,
  fetchChatRoomState,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  touchChatPresence
} from "@/lib/chat-client"
import type { ChatMembership, ChatMessage, ChatRoomState } from "@/lib/chat-types"
import { getLS, setLS, delLS, sessionKey, formatTime } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { getDeviceHash } from "@/lib/device-hash"

function getOrCreateSession(roomId: string): string {
  const existing = getLS<string>(sessionKey(roomId), null)
  if (existing) return existing
  const next = crypto.randomUUID()
  setLS(sessionKey(roomId), next)
  return next
}

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<number, ChatMessage>()
  current.forEach((msg) => map.set(msg.id, msg))
  incoming.forEach((msg) => map.set(msg.id, msg))
  return sortMessages(Array.from(map.values()))
}

export default function ChatRoom() {
  const params = useParams()
  const router = useRouter()
  const issueId = params.id as string
  const { user, loading: authLoading, signInWithGoogle } = useAuth()

  const scrollerRef = useRef<HTMLDivElement>(null)
  const membershipRef = useRef<ChatMembership | null>(null)

  const [roomState, setRoomState] = useState<ChatRoomState | null>(null)
  const [membership, setMembership] = useState<ChatMembership | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const [sessionId, setSessionId] = useState<string>("")

  const authGuard = (() => {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <Button variant="ghost" onClick={() => router.push("/")} className="mb-2 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로
              </Button>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-6">
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold">로그인이 필요합니다</h2>
                <p className="text-muted-foreground">채팅방에 입장하려면 로그인이 필요합니다.</p>
                <Button onClick={() => signInWithGoogle(`/chat/${issueId}`)}>
                  Google 로그인
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      )
    }

    return null
  })()

  useEffect(() => {
    if (!issueId) return
    const id = getOrCreateSession(issueId)
    setSessionId(id)
  }, [issueId])

  useEffect(() => {
    membershipRef.current = membership ?? null
  }, [membership])

  useEffect(() => {
    if (initialized || !sessionId || !user) return

    let cancelled = false

    async function initialize() {
      try {
        setLoading(true)
        setJoinError(null)

        if (cancelled) return

        await fetchChatRoomState(issueId).then((state) => {
          if (!cancelled) setRoomState(state)
        }).catch(() => undefined)

        if (cancelled) return

        const deviceHash = getDeviceHash()
        if (!user?.id) {
          setJoinError('로그인이 필요합니다')
          return
        }
        const joined = await joinChatRoom(issueId, {
          deviceHash,
          sessionId,
          userId: user.id
        })

        if (cancelled) return

        setMembership(joined)
        membershipRef.current = joined
        setRoomState((prev) => {
          if (!prev) return { ...joined }
          return {
            ...prev,
            roomId: joined.roomId ?? prev.roomId,
            capacity: joined.capacity ?? prev.capacity,
            activeMembers: joined.activeMembers ?? prev.activeMembers,
            lastMessageAt: joined.lastMessageAt ?? prev.lastMessageAt,
            issueTitle: prev.issueTitle ?? joined.issueTitle ?? null,
            issueThumbnail: prev.issueThumbnail ?? joined.issueThumbnail ?? null,
            issuePreview: prev.issuePreview ?? joined.issuePreview ?? null
          }
        })

        const history = await fetchChatMessages(issueId, joined.roomId, { limit: 100 })
        if (!cancelled) {
          setMessages(sortMessages(history))
        }

        if (!cancelled) {
          setInitialized(true)
        }
      } catch (error: any) {
        console.error('Failed to enter chat room:', error)
        if (!cancelled) {
          setJoinError(error?.message || '채팅방에 입장할 수 없습니다.')
          setMembership(null)
          membershipRef.current = null
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    initialize()

    return () => {
      cancelled = true
    }
  }, [initialized, issueId, sessionId, user])

  useEffect(() => {
    if (!membership) return

    let cancelled = false
    let isFetching = false

    async function syncMessages() {
      if (isFetching) return
      isFetching = true
      try {
        if (!membership?.roomId) return
        const latest = await fetchChatMessages(issueId, membership.roomId, { limit: 50 })
        if (!cancelled) {
          setMessages((prev) => mergeMessages(prev, latest))
        }
      } catch (error) {
        console.error('Failed to sync messages:', error)
      } finally {
        isFetching = false
      }
    }

    const pollTimer = window.setInterval(syncMessages, 4000)

    const presenceTimer = window.setInterval(async () => {
      try {
        const presence = await touchChatPresence(issueId, membership.memberId)
        if (!cancelled) {
          setRoomState((prev) =>
            prev ? { ...prev, activeMembers: presence.activeMembers } : prev
          )
        }
      } catch (error) {
        console.error('Failed to update presence:', error)
      }
    }, 25000)

    syncMessages()

    return () => {
      cancelled = true
      window.clearInterval(pollTimer)
      window.clearInterval(presenceTimer)
    }
  }, [issueId, membership])

  useEffect(() => {
    if (!scrollerRef.current) return

    const scroller = scrollerRef.current
    // 사용자가 최하단 근처에 있을 때만 자동 스크롤 (20px 허용)
    const isNearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 20

    if (isNearBottom) {
      // 다음 틱에서 스크롤 (메시지 렌더링 후)
      requestAnimationFrame(() => {
        scroller.scrollTop = scroller.scrollHeight
      })
    }
  }, [messages])

  useEffect(() => {
    return () => {
      const member = membershipRef.current
      if (member) {
        leaveChatRoom(issueId, member.memberId).catch((error) => {
          // 404 에러 (member not found)는 이미 나간 경우이므로 무시
          if (error?.message?.includes('채팅 참여 정보')) {
            console.debug('Member already left chat room')
            return
          }
          console.error('Failed to leave chat room:', error)
        })
      }
    }
  }, [issueId])

  useEffect(() => {
    if (!joinError) return
    const key = sessionKey(issueId)
    delLS(key)
    const next = getOrCreateSession(issueId)
    setSessionId(next)
    setInitialized(false)
    setJoinError(null)
  }, [joinError, issueId])

  if (authGuard) {
    return authGuard
  }

  const send = async () => {
    if (!membership) return
    const text = input.trim()
    if (!text) return

    setInput("")
    setMessageError(null)

    try {
      if (!membership.memberId) {
        console.error('Missing memberId in membership', membership)
        setMessageError('채팅 멤버 정보가 올바르지 않습니다. 새로고침 후 다시 시도해주세요.')
        setInput(text)
        return
      }
      const saved = await sendChatMessage(issueId, membership.memberId, text)
      setMessages((prev) => mergeMessages(prev, [saved]))
    } catch (error: any) {
      console.error('Failed to send message:', error)
      setMessageError(error?.message || '메시지를 전송하지 못했습니다.')
      setInput(text)
    }
  }

  const resolvedState = roomState ?? membership ?? null
  const activeMembers =
    typeof resolvedState?.activeMembers === 'number' ? resolvedState.activeMembers : null
  const capacity =
    typeof resolvedState?.capacity === 'number' ? resolvedState.capacity : null
  const isFull =
    activeMembers !== null && capacity !== null ? activeMembers >= capacity : false
  const headerTitle = (() => {
    const raw = resolvedState?.issueTitle
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
    return resolvedState ? `이슈 ${resolvedState.issueId} 채팅방` : '채팅방'
  })()
  const headerSubtitle = (() => {
    const raw = resolvedState?.issuePreview
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
    return ''
  })()
  const occupancyLabel =
    activeMembers !== null || capacity !== null
      ? `${(activeMembers ?? 0).toLocaleString()} / ${capacity?.toLocaleString() ?? '?'}`
      : loading
        ? '로딩 중...'
        : '참여자 수 확인 중'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="truncate text-lg font-semibold text-foreground">{headerTitle}</h1>
              {headerSubtitle && (
                <p className="text-sm text-muted-foreground truncate mt-1">{headerSubtitle}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-muted-foreground flex-wrap">
                <span className="flex items-center gap-2 text-sm">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium text-foreground">{occupancyLabel}</span>
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="truncate text-sm">
                  내 닉네임:
                  <strong className="text-foreground ml-1">
                    {user?.user_metadata?.nickname || "설정 중"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardContent className="p-0">
            <div ref={scrollerRef} className="h-[500px] overflow-y-auto p-4 space-y-3">
              {joinError ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center space-y-2">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                  <p>{joinError}</p>
                  {isFull && (
                    <p className="text-sm text-rose-500">채팅방 정원이 가득 찼습니다.</p>
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                  <p>아직 메시지가 없습니다.</p>
                  <p className="text-sm">첫 메시지를 남겨보세요!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isOwn = membership?.memberId === m.memberId

                  return (
                    <div key={m.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={isOwn ? "bg-indigo-600 text-white" : "bg-muted"}>
                          {m.authorNick?.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
                        {!isOwn && (
                          <span className="text-sm text-muted-foreground px-1">{m.authorNick}</span>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${isOwn ? "bg-indigo-600 text-white" : "bg-muted"}`}>
                          <p className="break-words">{m.body}</p>
                        </div>
                        <span className="text-xs text-muted-foreground px-1">{formatTime(m.createdAt)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          {messageError && (
            <div className="text-sm text-rose-500">{messageError}</div>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
              placeholder={joinError ? "채팅에 참여할 수 없습니다." : "메시지를 입력하세요..."}
              className="flex-1"
              disabled={!membership || !!joinError}
            />
            <Button onClick={send} disabled={!membership || !!joinError || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        © 2025 비하인드. 모두의 뒷얘기 살롱.
      </footer>
    </div>
  )
}
