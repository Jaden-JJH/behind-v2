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

interface VoteItem {
  voted_at: string
  poll_question: string
  issue: Issue
}

interface VotesResponse {
  votes: VoteItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function MyVotesPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { data: votesData, isLoading, error, fetch: fetchWithRetry } = useFetchWithRetry<VotesResponse>()
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
  const fetchVotes = useCallback(() => {
    if (!user || loading) return

    fetchWithRetry(
      `/api/my/votes?page=${page}&limit=20&filter=${filter}`,
      {
        maxRetries: 3,
        timeout: 10000,
        retryDelay: 1000,
      }
    )
  }, [user, loading, page, filter, fetchWithRetry])

  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">참여한 투표</h1>

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
                  `/api/my/votes?page=${page}&limit=20&filter=${filter}`,
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

      {/* 투표 목록 */}
      {!error && !isLoading && votesData && (!votesData.votes || votesData.votes.length === 0) ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">참여한 투표가 없습니다.</p>
        </Card>
      ) : !error && !isLoading && votesData ? (
        <>
          <div className="space-y-4">
            {votesData.votes.map((vote, index) => (
              <Card
                key={`${vote.issue.id}-${index}`}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/issues/${vote.issue.display_id}`)}
              >
                <div className="flex gap-4 p-4">
                  {/* 썸네일 */}
                  <div className="w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                    <ImageWithFallback
                      src={vote.issue.thumbnail}
                      alt={vote.issue.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 콘텐츠 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-snug">
                        {vote.issue.title}
                      </h3>
                      {vote.issue.status === 'active' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                          진행중
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          종료
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-1">{vote.issue.preview}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>투표일: {formatDate(vote.voted_at)}</span>
                      <span>•</span>
                      <span>댓글 {vote.issue.comment_count}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {votesData.pagination.totalPages > 1 && (
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
                {page} / {votesData.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === votesData.pagination.totalPages || isLoading}
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
