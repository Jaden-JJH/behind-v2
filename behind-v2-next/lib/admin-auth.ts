import crypto from 'crypto'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

// 환경 변수에서 시크릿 키 가져오기 (없으면 ADMIN_PASSWORD 해시 사용)
const getSecret = (): string => {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET or ADMIN_PASSWORD must be set')
  }
  return secret
}

// 토큰 만료 시간 (24시간)
const TOKEN_EXPIRY = 60 * 60 * 24

// Admin 토큰 쿠키 이름
export const ADMIN_TOKEN_COOKIE = 'admin-token'

interface TokenPayload {
  exp: number  // 만료 시간 (Unix timestamp)
  iat: number  // 발급 시간 (Unix timestamp)
}

/**
 * HMAC-SHA256 서명 생성
 */
function createSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')
}

/**
 * Admin 토큰 생성
 */
export function generateAdminToken(): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    exp: now + TOKEN_EXPIRY,
    iat: now
  }

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createSignature(payloadStr, getSecret())

  return `${payloadStr}.${signature}`
}

/**
 * Admin 토큰 검증
 * @returns true if valid, false otherwise
 */
export function verifyAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [payloadStr, signature] = parts

  // 서명 검증 (timing-safe comparison)
  const expectedSignature = createSignature(payloadStr, getSecret())

  if (signature.length !== expectedSignature.length) {
    return false
  }

  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false
  }

  // 페이로드 파싱 및 만료 시간 검증
  try {
    const payload: TokenPayload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf-8')
    )

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Admin 토큰 쿠키 설정
 */
export async function setAdminTokenCookie(): Promise<void> {
  const token = generateAdminToken()
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRY,
    path: '/'
  })
}

/**
 * Admin 토큰 쿠키 삭제
 */
export async function clearAdminTokenCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_TOKEN_COOKIE)
}

/**
 * Admin 인증 확인 (API Route에서 사용)
 * @throws Error if not authenticated
 */
export async function requireAdminAuth(): Promise<void> {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get(ADMIN_TOKEN_COOKIE)

  if (!tokenCookie?.value || !verifyAdminToken(tokenCookie.value)) {
    throw new Error('Unauthorized')
  }
}

/**
 * Admin 인증 상태 확인 (boolean 반환)
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get(ADMIN_TOKEN_COOKIE)

    if (!tokenCookie?.value) {
      return false
    }

    return verifyAdminToken(tokenCookie.value)
  } catch {
    return false
  }
}

/**
 * Middleware에서 사용하는 Admin 인증 확인
 * (NextRequest의 cookies 사용)
 */
export function verifyAdminTokenFromRequest(request: NextRequest): boolean {
  const tokenCookie = request.cookies.get(ADMIN_TOKEN_COOKIE)

  if (!tokenCookie?.value) {
    return false
  }

  return verifyAdminToken(tokenCookie.value)
}
