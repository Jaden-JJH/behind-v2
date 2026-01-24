'use client'

import { Eye, MessageCircle, Clock, ChevronRight, Archive } from "lucide-react"
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
  // 랭킹 뱃지 스타일 - 모든 순위 동일
  const getRankStyle = () => {
    return {
      badge: 'bg-slate-100 text-slate-600 font-semibold',
      border: 'border-slate-200 hover:border-slate-300',
      bg: 'bg-white'
    }
  }

  return (
    <div className="mt-6 sm:mt-7 md:mt-8 rounded-2xl overflow-hidden">
      {/* 다크 테마 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 px-5 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg">
              <Archive className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">지나간 이슈</h2>
              <p className="text-xs sm:text-sm text-slate-400">과거 화제가 되었던 이슈들</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/issues'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600/50 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            전체보기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 이슈 리스트 */}
      <div className="bg-white border border-t-0 border-slate-200 rounded-b-2xl divide-y divide-slate-100">
        {issues.map((issue, idx) => {
          const rankStyle = getRankStyle()
          return (
            <div
              key={issue.id}
              className={`group relative p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:bg-slate-50/80 ${idx === 0 ? 'rounded-t-none' : ''} ${idx === issues.length - 1 ? 'rounded-b-2xl' : ''}`}
              onClick={() => window.location.href = `/issues/${issue.display_id}`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {/* 순위 뱃지 */}
                <div className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base transition-transform group-hover:scale-105 ${rankStyle.badge}`}>
                  {idx + 1}
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-slate-900 transition-colors leading-snug line-clamp-2">
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(issue.created_at)}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-medium">{issue.view_count.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="font-medium">{issue.comment_count.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 화살표 */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-all group-hover:translate-x-0.5">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
