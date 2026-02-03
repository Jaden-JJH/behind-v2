import { Suspense } from "react"
import { fetchBannerIssues, fetchCarouselIssues } from "@/lib/server-data-fetchers"
import { WebSiteJsonLd } from "@/components/seo/JsonLd"
import { RollingBanner } from "@/components/RollingBanner"
import { IssuesCarousel } from "@/components/IssuesCarousel"
import { ReportBanner } from "@/components/ReportBanner"
import { MainContentSection } from "@/components/landing/MainContentSection"
import { SidebarSection } from "@/components/landing/SidebarSection"
import { MobileMainContent } from "@/components/landing/MobileMainContent"
import { MobileTrendingContent } from "@/components/landing/MobileTrendingContent"
import { MobileReportedContent } from "@/components/landing/MobileReportedContent"
import { MainContentSkeleton, SidebarSkeleton } from "@/components/landing/LoadingSkeleton"

/**
 * 메인 랜딩 페이지 (Server Component)
 * Streaming & Suspense를 활용한 점진적 로딩으로 초기 렌더링 속도 개선
 * 캐싱: 60초마다 페이지 재생성 (ISR)
 */
export const revalidate = 60 // 60초마다 재검증

export default async function LandingPage() {
  // 중요 콘텐츠만 먼저 로드 (배너, 캐러셀)
  const [bannerIssues, carouselIssues] = await Promise.all([
    fetchBannerIssues(),
    fetchCarouselIssues()
  ])

  return (
    <>
      <WebSiteJsonLd />
      <div className="min-h-screen bg-white">
        {/* 즉시 로드: 롤링 배너 */}
        <RollingBanner issues={bannerIssues} />

        {/* 즉시 로드: 캐러셀 */}
        <IssuesCarousel issues={carouselIssues} />

        {/* 즉시 로드: 제보하기 배너 */}
        <ReportBanner />

        {/* 모바일: 탭 네비게이션 */}
        <div className="md:hidden">
          <div className="sticky top-[60px] z-20 bg-white border-b border-slate-200">
            <div className="flex overflow-x-auto scrollbar-hide">
              <a href="#mobile-main" className="flex-1 min-w-[80px] px-4 py-3 text-sm font-medium whitespace-nowrap text-slate-900 border-b-2 border-slate-900">
                메인
              </a>
              <a href="#mobile-trending" className="flex-1 min-w-[80px] px-4 py-3 text-sm font-medium whitespace-nowrap text-slate-500 hover:text-slate-700">
                실시간 인기
              </a>
              <a href="#mobile-reported" className="flex-1 min-w-[80px] px-4 py-3 text-sm font-medium whitespace-nowrap text-slate-500 hover:text-slate-700">
                제보된 이슈
              </a>
            </div>
          </div>

          <div className="px-3 py-4 space-y-6">
            <div id="mobile-main">
              <Suspense fallback={<MainContentSkeleton />}>
                <MobileMainContent />
              </Suspense>
            </div>
            <div id="mobile-trending">
              <Suspense fallback={<SidebarSkeleton />}>
                <MobileTrendingContent />
              </Suspense>
            </div>
            <div id="mobile-reported">
              <Suspense fallback={<SidebarSkeleton />}>
                <MobileReportedContent />
              </Suspense>
            </div>
          </div>
        </div>

        {/* 데스크톱: 그리드 레이아웃 */}
        <main className="hidden md:grid max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* 메인 콘텐츠 - Suspense로 감싸서 스트리밍 */}
          <Suspense fallback={<MainContentSkeleton />}>
            <MainContentSection />
          </Suspense>

          {/* 사이드바 - Suspense로 감싸서 스트리밍 */}
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarSection />
          </Suspense>
        </main>
      </div>
    </>
  )
}
