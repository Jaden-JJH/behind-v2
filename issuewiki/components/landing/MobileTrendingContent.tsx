import { fetchTrendingIssues } from "@/lib/server-data-fetchers"
import { TrendingSection } from "@/components/landing/TrendingSection"

/**
 * 모바일 실시간 인기 탭 콘텐츠 (Server Component)
 */
export async function MobileTrendingContent() {
  const trendingIssues = await fetchTrendingIssues()
  return <TrendingSection issues={trendingIssues} />
}
