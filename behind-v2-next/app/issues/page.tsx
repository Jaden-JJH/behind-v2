import { fetchAllIssuesWithChat } from "@/lib/server-data-fetchers"
import { IssuesListClient } from "@/components/issues/IssuesListClient"

/**
 * 전체 이슈 목록 페이지 (Server Component)
 * 모든 이슈를 서버에서 페칭하여 초기 로딩 속도 개선
 */
export const revalidate = 60 // 60초마다 재검증

export default async function AllIssuesPage() {
  const { issues, chatStates } = await fetchAllIssuesWithChat()

  return <IssuesListClient initialIssues={issues} chatStates={chatStates} />
}
