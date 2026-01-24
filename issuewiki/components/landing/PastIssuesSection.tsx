'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, MessageCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface PastIssue {
  id: string
  display_id: number
  title: string
  created_at: string
  view_count: number
  comment_count: number
}

interface PastIssuesSectionProps {
  issues: PastIssue[]
}

export function PastIssuesSection({ issues }: PastIssuesSectionProps) {
  return (
    <Card className="mt-6 sm:mt-7 md:mt-8 bg-white border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-800">지나간 이슈</CardTitle>
        <p className="text-xs sm:text-sm text-slate-500">과거 화제가 되었던 이슈들을 다시 살펴보세요</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <div
              key={issue.id}
              className="group relative p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all cursor-pointer"
              onClick={() => window.location.href = `/issues/${issue.display_id}`}
            >
              <div className="flex items-start gap-3 sm:gap-3.5">
                {/* 순위 뱃지 */}
                <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base transition-colors ${
                  idx === 0
                    ? 'bg-yellow-100 text-yellow-700 group-hover:bg-yellow-200'
                    : idx === 1
                    ? 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                    : idx === 2
                    ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}>
                  {idx + 1}
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-slate-900 transition-colors leading-snug line-clamp-2 mb-2">
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                    <span className="text-slate-400">{formatDate(issue.created_at)}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{issue.view_count.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{issue.comment_count.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 화살표 */}
                <span className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all self-center">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => window.location.href = '/issues'}
          className="w-full mt-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-sm sm:text-base hover:bg-slate-50 hover:text-slate-800 transition-all"
        >
          더 많은 이슈 보기
        </button>
      </CardContent>
    </Card>
  )
}
