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
    <Card className="mt-6 sm:mt-7 md:mt-8 bg-white border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-800">지나간 이슈</CardTitle>
        <p className="text-xs sm:text-sm text-slate-500">과거 화제가 되었던 이슈들을 다시 살펴보세요</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 sm:space-y-3">
          {issues.map((issue, idx) => (
            <div
              key={issue.id}
              className="p-3 sm:p-3.5 md:p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group min-h-[60px]"
              onClick={() => window.location.href = `/issues/${issue.display_id}`}
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2">
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 rounded-full font-bold text-sm sm:text-base bg-slate-100 text-slate-600 group-hover:bg-yellow-100 group-hover:text-yellow-700 transition-colors">
                    {idx + 1}
                  </span>
                  <p className="text-sm sm:text-base text-slate-800 group-hover:text-slate-900 transition-colors flex-1 font-semibold leading-snug">
                    {issue.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="font-medium">{issue.view_count.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-1 sm:gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span className="font-medium">{issue.comment_count.toLocaleString()}</span>
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 ml-10 sm:ml-11">{formatDate(issue.created_at)}</p>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full mt-3 sm:mt-4 border-slate-300 text-slate-700 hover:bg-slate-100 min-h-[44px] text-sm sm:text-base"
          onClick={() => window.location.href = '/issues'}
        >
          더 많은 이슈 보기
        </Button>
      </CardContent>
    </Card>
  )
}
