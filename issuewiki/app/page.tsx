import Link from "next/link"
import { fetchLandingPageData } from "@/lib/server-data-fetchers"
import { WebSiteJsonLd } from "@/components/seo/JsonLd"
import { createClient } from "@/lib/supabase/server"
import { ActiveIssuesList } from "@/components/landing/ActiveIssuesList"
import { QuickVoteSection } from "@/components/landing/QuickVoteSection"
import { PastIssuesSection } from "@/components/landing/PastIssuesSection"
import { TrendingSection } from "@/components/landing/TrendingSection"
import { ReportedIssuesSection } from "@/components/landing/ReportedIssuesSection"
import { RollingBanner } from "@/components/RollingBanner"
import { IssuesCarousel } from "@/components/IssuesCarousel"
import { ReportBanner } from "@/components/ReportBanner"
import { MobileTabsWrapper } from "@/components/landing/MobileTabsWrapper"

/**
 * 메인 랜딩 페이지 (Server Component)
 * 모든 데이터를 서버에서 병렬로 페칭하여 초기 로딩 속도 개선
 * 캐싱: 60초마다 페이지 재생성 (ISR)
 */
export const revalidate = 60 // 60초마다 재검증

export default async function LandingPage() {
  // 현재 로그인한 사용자 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 서버에서 병렬로 모든 데이터 페칭 (userId 전달하여 is_curious 체크)
  const {
    activeIssues,
    pollIssues,
    pastIssues,
    trendingIssues,
    reportedIssues,
    bannerIssues,
    carouselIssues,
    chatStates
  } = await fetchLandingPageData(undefined, user?.id)

  // 모바일 탭 콘텐츠 정의
  const mobileMainContent = (
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

  const mobileTrendingContent = (
    <TrendingSection issues={trendingIssues} />
  )

  const mobileReportedContent = (
    <ReportedIssuesSection initialIssues={reportedIssues} />
  )

  const mobileTabs = [
    { id: 'main', label: '메인', content: mobileMainContent },
    { id: 'trending', label: '실시간 인기', content: mobileTrendingContent },
    { id: 'reported', label: '제보된 이슈', content: mobileReportedContent },
  ]

  // 데스크톱 콘텐츠 (기존 레이아웃)
  const desktopContent = (
    <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {/* 메인 컨텐츠 */}
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

      {/* 사이드바 */}
      <aside className="space-y-4 sm:space-y-5 md:space-y-6">
        {/* 실시간 인기 이슈 */}
        <TrendingSection issues={trendingIssues} />

        {/* 제보된 이슈 */}
        <ReportedIssuesSection initialIssues={reportedIssues} />
      </aside>
    </main>
  )

  return (
    <>
      <WebSiteJsonLd />
      <div className="min-h-screen bg-white">
        {/* 롤링 배너 */}
        <RollingBanner issues={bannerIssues} />

      {/* 캐러셀 */}
      <IssuesCarousel issues={carouselIssues} />

      {/* 제보하기 배너 */}
      <ReportBanner />

        {/* 모바일: 탭 네비게이션 / 데스크톱: 기존 그리드 레이아웃 */}
        <MobileTabsWrapper tabs={mobileTabs} desktopContent={desktopContent} />
      </div>
    </>
  )
}
