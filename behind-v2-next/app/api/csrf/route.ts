import { NextResponse } from 'next/server';
import { setCsrfToken } from '@/lib/csrf';

/**
 * CSRF 토큰 발급 API
 * GET /api/csrf
 * 
 * 프론트엔드가 페이지 로드 시 이 API를 호출하여 CSRF 토큰을 받습니다.
 * 토큰은 쿠키와 응답 본문 모두에 포함됩니다.
 */
export async function GET() {
  try {
    const token = await setCsrfToken();
    
    return NextResponse.json({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_TOKEN_GENERATION_FAILED',
          message: '토큰 생성에 실패했습니다.',
        },
      },
      { status: 500 }
    );
  }
}