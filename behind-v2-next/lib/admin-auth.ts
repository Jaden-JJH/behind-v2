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

// Base64URL 인코딩/디코딩 (Edge 호환)
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  // 패딩 복원
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return base64UrlEncode(binary)
}

/**
 * HMAC-SHA256 서명 생성 (Web Crypto API - Edge 호환)
 */
async function createSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const data = encoder.encode(payload)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data)
  return arrayBufferToBase64Url(signature)
}

/**
 * Timing-safe 문자열 비교 (Edge 호환)
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Admin 토큰 생성
 */
export async function generateAdminToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    exp: now + TOKEN_EXPIRY,
    iat: now
  }

  const payloadStr = base64UrlEncode(JSON.stringify(payload))
  const signature = await createSignature(payloadStr, getSecret())

  return `${payloadStr}.${signature}`
}

/**
 * Admin 토큰 검증
 * @returns true if valid, false otherwise
 */
export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [payloadStr, signature] = parts

  try {
    // 서명 검증 (timing-safe comparison)
    const expectedSignature = await createSignature(payloadStr, getSecret())

    if (!timingSafeEqual(signature, expectedSignature)) {
      return false
    }

    // 페이로드 파싱 및 만료 시간 검증
    const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadStr))

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
  const token = await generateAdminToken()
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

  if (!tokenCookie?.value) {
    throw new Error('Unauthorized')
  }

  const isValid = await verifyAdminToken(tokenCookie.value)
  if (!isValid) {
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

    return await verifyAdminToken(tokenCookie.value)
  } catch {
    return false
  }
}

/**
 * Middleware에서 사용하는 Admin 인증 확인
 * (NextRequest의 cookies 사용)
 */
export async function verifyAdminTokenFromRequest(request: NextRequest): Promise<boolean> {
  const tokenCookie = request.cookies.get(ADMIN_TOKEN_COOKIE)

  if (!tokenCookie?.value) {
    return false
  }

  return await verifyAdminToken(tokenCookie.value)
}
