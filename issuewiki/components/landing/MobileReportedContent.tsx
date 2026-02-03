import { cookies } from "next/headers"
import { fetchReportedIssues } from "@/lib/server-data-fetchers"
import { ReportedIssuesSection } from "@/components/landing/ReportedIssuesSection"
import { createClient } from "@/lib/supabase/server"
import { getDeviceHashFromCookie } from "@/lib/device-hash"

/**
 * 모바일 제보된 이슈 탭 콘텐츠 (Server Component)
 */
export async function MobileReportedContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 쿠키에서 deviceHash 가져오기
  const cookieStore = await cookies()
  const deviceHash = cookieStore.get('device_hash')?.value

  const reportedIssues = await fetchReportedIssues(deviceHash, user?.id)
  return <ReportedIssuesSection initialIssues={reportedIssues} />
}
