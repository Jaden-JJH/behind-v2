import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminTokenFromRequest } from '@/lib/admin-auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // 환경별 허용 오리진
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:3001'
  ]

  // CORS 헤더 설정
  const response = NextResponse.next()

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400') // 24시간
  }

  // OPTIONS 프리플라이트 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // /admin/login은 접근 허용
  if (pathname === '/admin/login') {
    return response
  }

  // /admin/* 경로 보호 (JWT 토큰 검증)
  if (pathname.startsWith('/admin')) {
    const isAuthenticated = verifyAdminTokenFromRequest(request)

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*']
}