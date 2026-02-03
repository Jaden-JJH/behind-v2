import Link from "next/link"
import { fetchActiveIssues, fetchPollIssues, fetchChatRoomStates } from "@/lib/server-data-fetchers"
import { ActiveIssuesList } from "@/components/landing/ActiveIssuesList"
import { QuickVoteSection } from "@/components/landing/QuickVoteSection"

/**
 * 모바일 메인 탭 콘텐츠 (Server Component)
 */
export async function MobileMainContent() {
  const [activeIssues, pollIssues] = await Promise.all([
    fetchActiveIssues(),
    fetchPollIssues()
  ])

  const issueIds = activeIssues.map(i => i.id).filter(Boolean)
  const chatStates = await fetchChatRoomStates(issueIds)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-1">
            지금 가장 뜨거운 토픽
          </h2>
          <p className="text-xs text-slate-600">
            실시간으로 가장 많은 관심을 받고 있는 이슈를 확인하세요
          </p>
        </div>
        <Link
          href="/issues"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all"
        >
          전체보기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      <ActiveIssuesList issues={activeIssues} chatStates={chatStates} />
      <QuickVoteSection pollIssues={pollIssues} />
    </div>
  )
}
