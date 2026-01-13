'use client'

import { IssueCard } from "@/components/issue-card"
import type { ChatRoomState } from "@/lib/chat-types"

interface ActiveIssue {
  id: string
  display_id: number
  title: string
  preview: string
  thumbnail?: string
  comment_count: number
  view_count: number
  status: string
}

interface ActiveIssuesListProps {
  issues: ActiveIssue[]
  chatStates: Record<string, ChatRoomState>
}

export function ActiveIssuesList({ issues, chatStates }: ActiveIssuesListProps) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-8">표시할 이슈가 없습니다.</div>
    )
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={{
            ...issue,
            commentCount: issue.comment_count,
            viewCount: issue.view_count,
            chat: chatStates[issue.id]
              ? {
                  activeMembers: chatStates[issue.id].activeMembers,
                  capacity: chatStates[issue.id].capacity,
                  isFull: chatStates[issue.id].activeMembers >= chatStates[issue.id].capacity
                }
              : undefined
          }}
          onOpenIssue={(display_id) => window.location.href = `/issues/${display_id}`}
          onOpenChat={(id) => window.location.href = `/chat/${id}`}
        />
      ))}
    </div>
  )
}
