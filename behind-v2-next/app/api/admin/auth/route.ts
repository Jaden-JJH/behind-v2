import { NextResponse } from 'next/server'
import { adminAuthLimiter, getClientIp } from '@/lib/rate-limiter'
import { withCsrfProtection } from '@/lib/api-helpers'
import { verifyPassword } from '@/lib/password'
import { setAdminTokenCookie } from '@/lib/admin-auth'

export async function POST(request: Request) {
  return withCsrfProtection(request, async (req) => {
    // Rate Limiting 체크
    const ip = getClientIp(req)
    const { success, limit, remaining, reset } = await adminAuthLimiter.limit(ip)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    const { password } = await req.json()

    // Base64 디코딩
    const hashedPassword = Buffer.from(process.env.ADMIN_PASSWORD!, 'base64').toString('utf-8')

    const verifyResult = await verifyPassword(password, hashedPassword)

    if (verifyResult) {
      // JWT 기반 토큰 생성 및 쿠키 설정
      await setAdminTokenCookie()

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  })
}
