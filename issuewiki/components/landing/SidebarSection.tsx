import { cookies } from "next/headers"
import { fetchTrendingIssues, fetchReportedIssues } from "@/lib/server-data-fetchers"
import { TrendingSection } from "@/components/landing/TrendingSection"
import { ReportedIssuesSection } from "@/components/landing/ReportedIssuesSection"
import { createClient } from "@/lib/supabase/server"
import { getDeviceHashFromCookie } from "@/lib/device-hash"

/**
 * 사이드바 섹션 (Server Component)
 * Suspense로 분리하여 스트리밍 가능
 */
export async function SidebarSection() {
  // 현재 로그인한 사용자 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 쿠키에서 deviceHash 가져오기
  const cookieStore = await cookies()
  const deviceHash = cookieStore.get('device_hash')?.value

  // 병렬로 데이터 페칭
  const [trendingIssues, reportedIssues] = await Promise.all([
    fetchTrendingIssues(),
    fetchReportedIssues(deviceHash, user?.id)
  ])

  return (
    <aside className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* 실시간 인기 이슈 */}
      <TrendingSection issues={trendingIssues} />

      {/* 제보된 이슈 */}
      <ReportedIssuesSection initialIssues={reportedIssues} />
    </aside>
  )
}
