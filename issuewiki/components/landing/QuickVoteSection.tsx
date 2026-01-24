'use client'

import { QuickVote } from "@/components/quick-vote"
import { Flame } from "lucide-react"

interface Poll {
  id: number
  question: string
  is_blinded: boolean
  blinded_at?: string
  options: Array<{
    id: number
    label: string
    vote_count: number
  }>
}

interface PollIssue {
  id: string
  display_id: number
  title: string
  poll: Poll | Poll[]
  show_in_main_poll: boolean
}

interface QuickVoteSectionProps {
  pollIssues: PollIssue[]
}

export function QuickVoteSection({ pollIssues }: QuickVoteSectionProps) {
  if (pollIssues.length === 0) {
    return null
  }

  return (
    <div className="relative mt-4 sm:mt-6 md:mt-8 rounded-2xl overflow-hidden">
      {/* 다크 테마 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 px-5 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg shadow-orange-500/25">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">실시간 투표</h2>
            <p className="text-xs sm:text-sm text-slate-400">지금 뜨거운 이슈에 투표하세요</p>
          </div>
        </div>
      </div>

      {/* 투표 카드 영역 */}
      <div className="bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 md:p-6 border border-t-0 border-slate-200 rounded-b-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {pollIssues.map((issue) => {
            const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll

            if (!poll || !poll.options || !Array.isArray(poll.options)) {
              return null
            }

            return (
              <QuickVote
                key={poll.id}
                pollId={String(poll.id)}
                question={poll.question || issue.title}
                options={poll.options.map((opt) => ({
                  id: String(opt.id),
                  label: opt.label,
                  count: opt.vote_count
                }))}
                onCta={() => window.location.href = `/issues/${issue.display_id}`}
                isBlinded={poll.is_blinded}
                blindedAt={poll.blinded_at}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
