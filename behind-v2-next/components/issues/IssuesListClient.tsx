'use client'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageCircle, Users, Eye, Clock } from "lucide-react"
import { ImageWithFallback } from "@/components/figma/ImageWithFallback"
import type { ChatRoomState } from "@/lib/chat-types"
import { formatTime } from "@/lib/utils"

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-5 md:mb-6">
          <Button variant="ghost" onClick={() => router.push('/')} className="mb-4 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2">
            모든 이슈
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            전체 {filteredAndSortedIssues.length}개의 이슈
          </p>
        </div>

        {/* 필터 및 정렬 */}
        <div className="mb-6 space-y-4">
          {/* 카테고리 필터 */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 md:overflow-x-visible">
            <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0 pb-2 md:pb-0">
              {categories.map(cat => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                  className="flex-shrink-0 min-h-[44px]"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 정렬 및 상태 필터 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === "latest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("latest")}
              className="min-h-[44px]"
            >
              최신순
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("popular")}
              className="min-h-[44px]"
            >
              인기순
            </Button>
            <Button
              variant={sortBy === "comments" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("comments")}
              className="min-h-[44px]"
            >
              댓글순
            </Button>

            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant={status === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("all")}
                className="min-h-[44px]"
              >
                전체
              </Button>
              <Button
                variant={status === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("active")}
                className="min-h-[44px]"
              >
                진행중
              </Button>
              <Button
                variant={status === "closed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("closed")}
                className="min-h-[44px]"
              >
                마감
              </Button>
            </div>
          </div>
        </div>

        {/* 이슈 목록 */}
        <div className="space-y-4">
          {filteredAndSortedIssues.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-500">해당 조건의 이슈가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedIssues.map(issue => {
              const chatState = chatStates[issue.id]
              const chatActiveMembers = chatState?.activeMembers ?? 0
              const chatCapacity = chatState?.capacity ?? issue.capacity ?? 0
              const isChatFull = chatCapacity > 0 && chatActiveMembers >= chatCapacity

              return (
                <Card
                  key={issue.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/issues/${issue.display_id}`)}
                >
                  <CardContent className="p-0">
                    <div className="flex gap-2 sm:gap-3 md:gap-4 p-3 sm:p-3.5 md:p-4">
                      {/* 썸네일 */}
                      <div className="relative w-40 h-32 sm:w-44 sm:h-36 md:w-48 md:h-36 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                        <ImageWithFallback
                          src={issue.thumbnail}
                          alt={issue.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 콘텐츠 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <Badge variant="secondary" className="flex-shrink-0">
                            {issue.category}
                          </Badge>
                          {issue.status === "closed" && (
                            <Badge variant="outline" className="flex-shrink-0">
                              마감
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                          {issue.title}
                        </h3>

                        <p className="text-xs sm:text-sm md:text-base text-slate-600 mb-3 line-clamp-2">
                          {issue.preview}
                        </p>

                        {/* 메타 정보 - 2x2 그리드로 배치 */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{formatTime(new Date(issue.created_at).getTime())}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{issue.view_count.toLocaleString()}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{issue.comment_count || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {chatActiveMembers}/{chatCapacity || '—'}
                              {isChatFull && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  만석
                                </Badge>
                              )}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
