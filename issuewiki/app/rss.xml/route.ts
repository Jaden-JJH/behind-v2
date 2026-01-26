import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1시간마다 재검증

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://issuewiki.com'

  try {
    const { data: issues, error } = await supabaseAdmin
      .from('issues')
      .select('display_id, title, preview, summary, thumbnail, category, created_at')
      .eq('approval_status', 'approved')
      .eq('status', 'active')
      .eq('visibility', 'active')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch issues for RSS:', error)
      return new Response('Error generating RSS feed', { status: 500 })
    }

    const rssItems = (issues || []).map((issue) => {
      const description = issue.summary || issue.preview || ''
      const pubDate = new Date(issue.created_at).toUTCString()

      return `
    <item>
      <title><![CDATA[${issue.title}]]></title>
      <link>${baseUrl}/issues/${issue.display_id}</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${baseUrl}/issues/${issue.display_id}</guid>
      ${issue.category ? `<category><![CDATA[${issue.category}]]></category>` : ''}
      ${issue.thumbnail ? `<enclosure url="${issue.thumbnail}" type="image/jpeg" length="0" />` : ''}
    </item>`
    }).join('')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>이슈위키 - 대한민국 No.1 뉴스 아카이브</title>
    <link>${baseUrl}</link>
    <description>지금 가장 뜨거운 이슈의 뒷이야기를 나누는 공간</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/issuewiki-logo.png</url>
      <title>이슈위키</title>
      <link>${baseUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Failed to generate RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
