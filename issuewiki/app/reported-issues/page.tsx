import { Metadata } from 'next'
import { fetchReportedIssues } from '@/lib/server-data-fetchers'
import { ReportedIssuesClient } from '@/components/reported-issues/ReportedIssuesClient'

// 60초마다 재검증
export const revalidate = 60

export const metadata: Metadata = {
  title: '제보된 이슈 | 이슈위키',
  description: '궁금해요 수가 목표치에 도달하면 공개되는 제보된 이슈들을 확인하세요.',
  openGraph: {
    title: '제보된 이슈 | 이슈위키',
    description: '궁금해요 수가 목표치에 도달하면 공개되는 제보된 이슈들을 확인하세요.',
    siteName: '이슈위키',
  },
}

/**
 * 제보된 이슈 페이지 (Server Component)
 * SEO를 위해 서버에서 초기 데이터를 페칭하여 HTML에 콘텐츠 포함
 */
export default async function ReportedIssuesPage() {
  // 서버에서 초기 데이터 fetch (전체, 최신순)
  const reports = await fetchReportedIssues()

  return <ReportedIssuesClient initialReports={reports} />
}
