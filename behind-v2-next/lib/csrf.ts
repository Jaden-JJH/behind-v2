import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * CSRF 토큰 생성
 * 32바이트 랜덤 문자열 생성
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF 토큰을 쿠키에 설정
 * 쿠키명: csrf-token
 * 설정: HttpOnly=false (클라이언트에서 읽기 가능), SameSite=Strict
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  
  cookieStore.set('csrf-token', token, {
    httpOnly: false, // 클라이언트에서 읽을 수 있어야 함
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24시간
  });
  
  return token;
}

/**
 * CSRF 토큰 검증
 * 쿠키의 토큰과 헤더의 토큰을 비교
 */
export async function verifyCsrfToken(headerToken: string | null): Promise<boolean> {
  if (!headerToken) {
    return false;
  }
  
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('csrf-token')?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  // 타이밍 공격 방지를 위한 상수 시간 비교
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * CSRF 검증 미들웨어
 * API Route에서 사용
 */
export async function validateCsrf(request: Request): Promise<boolean> {
  const headerToken = request.headers.get('x-csrf-token');
  return await verifyCsrfToken(headerToken);
}