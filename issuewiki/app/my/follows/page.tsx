'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useFetchWithRetry } from '@/hooks/useFetchWithRetry'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageWithFallback } from '@/components/figma/ImageWithFallback'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface Issue {
  id: string
  display_id: number
  title: string
  preview: string
  thumbnail?: string
  status: string
  created_at: string
  comment_count: number
}

interface FollowedIssue extends Issue {
  follow_created_at: string
}

interface FollowsResponse {
  follows: FollowedIssue[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function MyFollowsPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { data: apiResponse, isLoading, error, fetch: fetchWithRetry } = useFetchWithRetry<{ success: boolean; data: { follows: FollowedIssue[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }>()
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all')
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

    const url = `/api/my/follows?page=${page}&limit=20&filter=${filter}`

    fetchWithRetry(url, {
      maxRetries: 3,
      timeout: 10000,
      retryDelay: 1000,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, page, filter])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">팔로우한 이슈</h1>

      {/* 필터 버튼 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('all')
            setPage(1)
          }}
        >
          전체
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('active')
            setPage(1)
          }}
        >
          진행중
        </Button>
        <Button
          variant={filter === 'ended' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('ended')
            setPage(1)
          }}
        >
          종료
        </Button>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-32 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-32 bg-slate-200 rounded animate-pulse"></div>
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
                  `/api/my/follows?page=${page}&limit=20&filter=${filter}`,
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

      {/* 팔로우 이슈 목록 */}
      {!error && !isLoading && apiResponse && apiResponse.data && (!apiResponse.data.follows || apiResponse.data.follows.length === 0) ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">팔로우한 이슈가 없습니다.</p>
        </Card>
      ) : !error && !isLoading && apiResponse && apiResponse.data ? (
        <>
          <div className="space-y-4">
            {apiResponse.data.follows.map((follow) => (
              <Card
                key={follow.id}
                className="border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                onClick={() => router.push(`/issues/${follow.display_id}`)}
              >
                <div className="flex gap-4 p-4">
                  {/* 썸네일 */}
                  <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <ImageWithFallback
                      src={follow.thumbnail}
                      alt={follow.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 콘텐츠 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {follow.title}
                      </h3>
                      {follow.status === 'active' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                          진행중
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">
                          종료
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-1">{follow.preview}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>팔로우: {formatDate(follow.follow_created_at)}</span>
                      <span>•</span>
                      <span>댓글 {follow.comment_count}</span>
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
              <span className="px-4 py-2 text-sm text-slate-700">
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
