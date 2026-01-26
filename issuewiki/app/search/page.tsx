import { Metadata } from 'next'
import { searchIssues } from '@/lib/server-data-fetchers'
import { SearchClient } from '@/components/search/SearchClient'

// 검색 결과가 없는 기본 페이지는 정적 생성
// 검색어가 있으면 동적으로 렌더링
export const revalidate = 60

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

/**
 * 동적 메타데이터 생성 (SEO)
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams

  if (q) {
    return {
      title: `"${q}" 검색 결과 | 이슈위키`,
      description: `"${q}"에 대한 이슈위키 검색 결과입니다.`,
      openGraph: {
        title: `"${q}" 검색 결과 | 이슈위키`,
        description: `"${q}"에 대한 이슈위키 검색 결과입니다.`,
        siteName: '이슈위키',
      },
    }
  }

  return {
    title: '검색 | 이슈위키',
    description: '이슈위키에서 관심 있는 이슈와 뉴스를 검색하세요.',
    openGraph: {
      title: '검색 | 이슈위키',
      description: '이슈위키에서 관심 있는 이슈와 뉴스를 검색하세요.',
      siteName: '이슈위키',
    },
  }
}

/**
 * 검색 페이지 (Server Component)
 * SEO를 위해 검색어가 있으면 서버에서 결과를 페칭하여 HTML에 포함
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q || ''

  // 검색어가 있으면 서버에서 초기 검색 실행
  const results = query ? await searchIssues(query) : []

  return <SearchClient initialQuery={query} initialResults={results} />
}
