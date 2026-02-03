import Link from "next/link"
import { fetchActiveIssues, fetchPollIssues, fetchPastIssues, fetchChatRoomStates } from "@/lib/server-data-fetchers"
import { ActiveIssuesList } from "@/components/landing/ActiveIssuesList"
import { QuickVoteSection } from "@/components/landing/QuickVoteSection"
import { PastIssuesSection } from "@/components/landing/PastIssuesSection"

/**
 * 메인 콘텐츠 섹션 (Server Component)
 * Suspense로 분리하여 스트리밍 가능
 */
export async function MainContentSection() {
  // 병렬로 데이터 페칭
  const [activeIssues, pollIssues, pastIssues] = await Promise.all([
    fetchActiveIssues(),
    fetchPollIssues(),
    fetchPastIssues(5)
  ])

  // 활성 이슈의 채팅방 상태 조회
  const issueIds = activeIssues.map(i => i.id).filter(Boolean)
  const chatStates = await fetchChatRoomStates(issueIds)

  return (
    <section className="md:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-800 mb-1">
            지금 가장 뜨거운 토픽
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600">
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

      {/* 활성 이슈 목록 */}
      <ActiveIssuesList issues={activeIssues} chatStates={chatStates} />

      {/* 실시간 투표 */}
      <QuickVoteSection pollIssues={pollIssues} />

      {/* 지나간 이슈 */}
      <PastIssuesSection issues={pastIssues} />
    </section>
  )
}
