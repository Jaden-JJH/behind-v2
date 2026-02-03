import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://issuewiki.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/my/', '/auth/'],
        // crawlDelay 제거 (Google은 무시함)
      },
      // Googlebot 명시적 허용
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/my/', '/auth/'],
      },
      // 채팅방은 허용 (공개 콘텐츠)
      {
        userAgent: '*',
        allow: '/chat/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
