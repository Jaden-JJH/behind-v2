import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCode
} from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname } = body

    // 1. 닉네임 형식 검증
    if (!nickname || typeof nickname !== 'string') {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400)
    }

    // 길이 체크
    if (nickname.length < 2) {
      return createErrorResponse(ErrorCode.NICKNAME_TOO_SHORT, 400)
    }

    if (nickname.length > 20) {
      return createErrorResponse(ErrorCode.NICKNAME_TOO_LONG, 400)
    }

    // 정규식 체크: 한글, 영문, 숫자만 허용
    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,20}$/
    if (!nicknameRegex.test(nickname)) {
      return createErrorResponse(ErrorCode.NICKNAME_INVALID, 400)
    }

    // 2. 중복 체크
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('nickname')
      .eq('nickname', nickname)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = 결과 없음 (중복 아님)
      console.error('Nickname check error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    // 3. 결과 반환
    const available = !data // data가 없으면 사용 가능
    
    if (!available) {
      return createErrorResponse(ErrorCode.NICKNAME_TAKEN, 409)
    }

    return createSuccessResponse({ available: true })
  } catch (error) {
    console.error('Check nickname error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}