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
    <div className="relative mt-4 sm:mt-6 md:mt-8 p-4 sm:p-5 md:p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
      <div className="absolute -top-3 left-6 px-4 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-full shadow-md flex items-center gap-2 animate-pulse">
        <Flame className="w-4 h-4" />
        <span>실시간 투표 참여하기</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 md:gap-4 mt-3">
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
