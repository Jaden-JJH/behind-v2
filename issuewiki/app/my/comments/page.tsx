'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useFetchWithRetry } from '@/hooks/useFetchWithRetry'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, AlertCircle, RotateCcw } from 'lucide-react'
import { ImageWithFallback } from '@/components/figma/ImageWithFallback'

interface Issue {
  id: string
  display_id: number
  title: string
  thumbnail?: string
}

interface CommentItem {
  id: string
  body: string
  up: number
  down: number
  created_at: string
  issue_id: string
  issues: Issue
}

interface CommentsResponse {
  comments: CommentItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function MyCommentsPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const { data: apiResponse, isLoading, error, fetch: fetchWithRetry } = useFetchWithRetry<{ success: boolean; data: CommentsResponse }>()
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
      `/api/my/comments?page=${page}&limit=20`,
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">내가 쓴 댓글</h1>

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
                  `/api/my/comments?page=${page}&limit=20`,
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

      {/* 댓글 목록 */}
      {!error && !isLoading && apiResponse?.data && (!apiResponse.data.comments || apiResponse.data.comments.length === 0) ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">작성한 댓글이 없습니다.</p>
        </Card>
      ) : !error && !isLoading && apiResponse?.data ? (
        <>
          <div className="space-y-4">
            {apiResponse.data.comments.map((comment) => (
              <Card
                key={comment.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/issues/${comment.issues.display_id}#comment-${comment.id}`)}
              >
                <div className="p-4">
                  {/* 이슈 정보 */}
                  <div className="flex gap-3 mb-3 pb-3 border-b border-gray-100">
                    <div className="w-16 h-10 flex-shrink-0 rounded overflow-hidden bg-slate-100">
                      <ImageWithFallback
                        src={comment.issues.thumbnail}
                        alt={comment.issues.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {comment.issues.title}
                      </h3>
                    </div>
                  </div>

                  {/* 댓글 내용 */}
                  <p className="text-slate-700 mb-3 whitespace-pre-wrap break-words">
                    {comment.body}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(comment.created_at)}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {comment.up}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        {comment.down}
                      </span>
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
