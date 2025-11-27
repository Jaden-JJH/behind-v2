'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useFetchWithRetry } from '@/hooks/useFetchWithRetry'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/figma/ImageWithFallback'
import { AlertCircle, RotateCcw, MessageCircle, Users } from 'lucide-react'

interface Issue {
  id: string
  display_id: number
  title: string
  preview: string
  thumbnail?: string
  status: string
}

interface ChatRoomItem {
  room_id: string
  issue_id: string
  joined_at: string
  last_seen: string
  active_member_count: number
  capacity: number
  issue: Issue
}

interface ChatRoomsResponse {
  chatRooms: ChatRoomItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function MyChatRoomsPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { data: apiResponse, isLoading, error, fetch: fetchWithRetry } = useFetchWithRetry<{ success: boolean; data: ChatRoomsResponse }>()
  const [page, setPage] = useState(1)
  const [loginAttempted, setLoginAttempted] = useState(false)
  const authCheckRef = useRef(false)

  // 인증 처리
  useEffect(() => {
    if (loading || authCheckRef.current) return

    if (!user && !loginAttempted) {
      authCheckRef.current = true
      setLoginAttempted(true)
      signInWithGoogle()
      return
    }

    if (!user && loginAttempted) {
      authCheckRef.current = true
      router.push('/')
      return
    }
  }, [user, loading, loginAttempted, signInWithGoogle, router])

  // 데이터 조회
  useEffect(() => {
    if (!user || loading) return

    fetchWithRetry(
      `/api/my/chat-rooms?page=${page}&limit=20`,
      {
        maxRetries: 3,
        timeout: 10000,
        retryDelay: 1000,
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, page])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">참여한 채팅방</h1>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-2">데이터를 불러올 수 없습니다</p>
              <p className="text-sm text-red-700 mb-4">
                {error.message === 'Unauthorized - please login again'
                  ? '세션이 만료되었습니다. 다시 로그인해주세요.'
                  : '네트워크 문제가 발생했습니다. 다시 시도해주세요.'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-100"
                onClick={() => fetchWithRetry(
                  `/api/my/chat-rooms?page=${page}&limit=20`,
                  {
                    maxRetries: 3,
                    timeout: 10000,
                    retryDelay: 1000,
                  }
                )}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 채팅방 목록 */}
      {!error && !isLoading && apiResponse?.data && (!apiResponse.data.chatRooms || apiResponse.data.chatRooms.length === 0) ? (
        <Card className="p-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">참여한 채팅방이 없습니다.</p>
        </Card>
      ) : !error && !isLoading && apiResponse?.data ? (
        <>
          <div className="space-y-4">
            {apiResponse.data.chatRooms.map((chatRoom, index) => (
              <Card
                key={`${chatRoom.room_id}-${index}`}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/chat/${chatRoom.issue.display_id}`)}
              >
                <div className="flex gap-4 p-4">
                  {/* 썸네일 */}
                  <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <ImageWithFallback
                      src={chatRoom.issue.thumbnail}
                      alt={chatRoom.issue.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 콘텐츠 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {chatRoom.issue.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{chatRoom.active_member_count}/{chatRoom.capacity}</span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-1">{chatRoom.issue.preview}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>마지막 활동: {formatTime(chatRoom.last_seen)}</span>
                      <span>•</span>
                      <span>참여일: {formatDate(chatRoom.joined_at)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {apiResponse.data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || isLoading}
                onClick={() => setPage(page - 1)}
              >
                이전
              </Button>
              <span className="px-4 py-2 text-sm text-gray-700">
                {page} / {apiResponse.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === apiResponse.data.pagination.totalPages || isLoading}
                onClick={() => setPage(page + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}