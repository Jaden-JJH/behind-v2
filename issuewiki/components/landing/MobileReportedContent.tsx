import { fetchReportedIssues } from "@/lib/server-data-fetchers"
import { ReportedIssuesSection } from "@/components/landing/ReportedIssuesSection"
import { createClient } from "@/lib/supabase/server"

/**
 * 모바일 제보된 이슈 탭 콘텐츠 (Server Component)
 */
export async function MobileReportedContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const reportedIssues = await fetchReportedIssues(undefined, user?.id)
  return <ReportedIssuesSection initialIssues={reportedIssues} />
}
