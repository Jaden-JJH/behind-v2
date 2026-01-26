import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
    const { data: issues } = await supabaseAdmin
      .from('issues')
      .select('display_id, updated_at')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .eq('visibility', 'active')
      .order('updated_at', { ascending: false })
      .limit(1000)

    const issuePages: MetadataRoute.Sitemap = (issues || []).map((issue) => ({
      url: `${baseUrl}/issues/${issue.display_id}`,
      lastModified: new Date(issue.updated_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...issuePages]
  } catch (error) {
    console.error('Failed to fetch issues for sitemap:', error)
    return staticPages
  }
}
