import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchIssueDetailPageData } from '@/lib/server-data-fetchers'
import { IssueDetailClient } from '@/components/issues/IssueDetailClient'
import { ArticleJsonLd } from '@/components/seo/JsonLd'

// 60초마다 재검증
export const revalidate = 60

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 동적 메타데이터 생성 (SEO)
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await fetchIssueDetailPageData(id)

  if (!data) {
    return {
      title: '이슈를 찾을 수 없습니다 | 이슈위키',
      description: '요청하신 이슈를 찾을 수 없습니다.',
    }
  }

  const { issue } = data
  const title = `${issue.title} | 이슈위키`
  const description = issue.summary || issue.preview || '이슈위키에서 최신 이슈를 확인하세요.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: issue.thumbnail ? [{ url: issue.thumbnail }] : [],
      siteName: '이슈위키',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: issue.thumbnail ? [issue.thumbnail] : [],
    },
  }
}

/**
 * 이슈 상세 페이지 (Server Component)
 * SEO를 위해 서버에서 데이터를 페칭하여 초기 HTML에 콘텐츠 포함
 */
export default async function IssueDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await fetchIssueDetailPageData(id)

  if (!data) {
    notFound()
  }

  const { issue, articles, chatState } = data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://issuewiki.com'

  return (
    <>
      <ArticleJsonLd
        title={issue.title}
        description={issue.summary || issue.preview || ''}
        url={`${baseUrl}/issues/${issue.display_id}`}
        image={issue.thumbnail}
        datePublished={issue.created_at}
        category={issue.category}
      />
      <IssueDetailClient
        issue={issue}
        articles={articles}
        initialChatState={chatState}
      />
    </>
  )
}
