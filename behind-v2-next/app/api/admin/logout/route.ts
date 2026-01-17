import { NextResponse } from 'next/server'
import { withCsrfProtection } from '@/lib/api-helpers'
import { clearAdminTokenCookie } from '@/lib/admin-auth'

export async function POST(request: Request) {
  return withCsrfProtection(request, async () => {
    // 토큰 쿠키 삭제
    await clearAdminTokenCookie()

    return NextResponse.json({ success: true })
  })
}