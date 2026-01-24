'use client'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { IssueCard } from "@/components/issue-card"
import type { ChatRoomState } from "@/lib/chat-types"

interface Issue {
  id: string
  display_id: number
  title: string
  preview: string
  thumbnail?: string
  category: string
  status: string
  view_count: number
  comment_count: number
  created_at: string
  capacity?: number
}

interface IssuesListClientProps {
  initialIssues: Issue[]
  chatStates: Record<string, ChatRoomState>
}

export function IssuesListClient({ initialIssues, chatStates }: IssuesListClientProps) {
  const router = useRouter()
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("latest")
  const [status, setStatus] = useState("all")

  const categories = [
    { value: "all", label: "전체" },
    { value: "사회", label: "사회" },
    { value: "연예", label: "연예" },
    { value: "스포츠", label: "스포츠" },
    { value: "정치", label: "정치" },
    { value: "경제", label: "경제" },
    { value: "IT/과학", label: "IT/과학" },
    { value: "기타", label: "기타" }
  ]

  const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "popular", label: "인기순" },
    { value: "comments", label: "댓글순" }
  ]

  const statusOptions = [
    { value: "all", label: "전체" },
    { value: "active", label: "진행중" },
    { value: "closed", label: "마감" }
  ]

  // 필터링 및 정렬
  const filteredAndSortedIssues = useMemo(() => {
    let filtered = [...initialIssues]

    // 카테고리 필터
    if (category !== "all") {
      filtered = filtered.filter(issue => issue.category === category)
    }

    // 상태 필터
    if (status !== "all") {
      filtered = filtered.filter(issue => issue.status === status)
    }

    // 정렬
    if (sortBy === "popular") {
      filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    } else if (sortBy === "comments") {
      filtered.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0))
    } else {
      // latest (기본값)
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return filtered
  }, [initialIssues, category, status, sortBy])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">홈으로</span>
          </button>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-800 mb-1">
                모든 이슈
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-600">
                전체 {filteredAndSortedIssues.length}개의 이슈를 확인하세요
              </p>
            </div>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="mb-6 space-y-4">
          {/* 카테고리 필터 - 칩 스타일 */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 md:overflow-x-visible">
            <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0 pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                    category === cat.value
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 및 상태 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 정렬 옵션 */}
            <div className="flex gap-1.5">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    sortBy === opt.value
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-slate-200 mx-2 hidden sm:block" />

            {/* 상태 필터 */}
            <div className="flex gap-1.5 ml-auto sm:ml-0">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    status === opt.value
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 이슈 목록 */}
        <div className="space-y-4">
          {filteredAndSortedIssues.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-base">해당 조건의 이슈가 없습니다.</p>
            </div>
          ) : (
            filteredAndSortedIssues.map(issue => {
              const chatState = chatStates[issue.id]

              return (
                <IssueCard
                  key={issue.id}
                  issue={{
                    id: issue.id,
                    display_id: issue.display_id,
                    title: issue.title,
                    preview: issue.preview,
                    thumbnail: issue.thumbnail,
                    commentCount: issue.comment_count,
                    viewCount: issue.view_count,
                    chat: chatState
                      ? {
                          activeMembers: chatState.activeMembers,
                          capacity: chatState.capacity,
                          isFull: chatState.activeMembers >= chatState.capacity
                        }
                      : undefined
                  }}
                  onOpenIssue={(display_id) => router.push(`/issues/${display_id}`)}
                  onOpenChat={(id) => router.push(`/chat/${id}`)}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
