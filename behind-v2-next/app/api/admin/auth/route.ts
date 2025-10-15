import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuthLimiter, getClientIp } from '@/lib/rate-limiter'
import { withCsrfProtection } from '@/lib/api-helpers'

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

    if (password === process.env.ADMIN_PASSWORD) {
      cookies().set('admin-auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 24시간
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  })
}
