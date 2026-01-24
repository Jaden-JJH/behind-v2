import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf } from './csrf';

/**
 * CSRF 보호가 필요한 메서드
 */
const PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * API Route에서 CSRF 검증을 수행하는 래퍼 함수
 */
export async function withCsrfProtection(
  request: Request,
  handler: (request: Request) => Promise<NextResponse>
): Promise<NextResponse> {
  // GET, HEAD, OPTIONS는 CSRF 검증 불필요
  if (!PROTECTED_METHODS.includes(request.method)) {
    return handler(request);
  }
  
  // CSRF 토큰 검증
  const isValid = await validateCsrf(request);
  
  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_TOKEN_INVALID',
          message: '잘못된 요청입니다. 페이지를 새로고침 해주세요.',
        },
      },
      { status: 403 }
    );
  }
  
  return handler(request);
}