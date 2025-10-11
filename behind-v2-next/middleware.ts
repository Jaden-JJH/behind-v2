import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // /admin/login은 접근 허용
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }
  
  // /admin/* 경로 보호
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('admin-auth')
    
    if (authCookie?.value !== 'true') {
      // 인증되지 않았으면 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}