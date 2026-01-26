import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

// sitemap을 요청 시마다 동적으로 생성 (최신 이슈 포함)
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1시간마다 재검증

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://issuewiki.com'

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/issues`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reported-issues`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // 동적 이슈 페이지
  try {
    const { data: issues, error } = await supabaseAdmin
      .from('issues')
      .select('display_id, created_at')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .eq('visibility', 'active')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Failed to fetch issues for sitemap:', error)
      return staticPages
    }

    const issuePages: MetadataRoute.Sitemap = (issues || []).map((issue) => ({
      url: `${baseUrl}/issues/${issue.display_id}`,
      lastModified: new Date(issue.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...issuePages]
  } catch (error) {
    console.error('Failed to fetch issues for sitemap:', error)
    return staticPages
  }
}
