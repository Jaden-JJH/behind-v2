import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://issuewiki.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/my/', '/auth/', '/chat/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
