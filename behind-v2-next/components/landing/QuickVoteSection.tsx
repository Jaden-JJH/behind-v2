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
    <div className="relative mt-4 sm:mt-6 md:mt-8 p-4 sm:p-5 md:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/80">
      <div className="absolute -top-3.5 left-6 px-4 py-2 bg-slate-800 text-yellow-400 text-sm font-semibold rounded-full flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-400" />
        <span>실시간 투표 참여하기</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-4 md:gap-5 mt-4">
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
  )
}
