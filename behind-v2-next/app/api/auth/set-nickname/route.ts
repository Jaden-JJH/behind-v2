import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCode
} from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 로그인 체크
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED, 401)
    }

    const body = await request.json()
    const { nickname } = body

    // 2. 닉네임 형식 검증
    if (!nickname || typeof nickname !== 'string') {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400)
    }

    if (nickname.length < 2) {
      return createErrorResponse(ErrorCode.NICKNAME_TOO_SHORT, 400)
    }

    if (nickname.length > 20) {
      return createErrorResponse(ErrorCode.NICKNAME_TOO_LONG, 400)
    }

    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,20}$/
    if (!nicknameRegex.test(nickname)) {
      return createErrorResponse(ErrorCode.NICKNAME_INVALID, 400)
    }

    // 3. 중복 체크
    const { data: existingUser } = await supabase
      .from('users')
      .select('nickname')
      .eq('nickname', nickname)
      .single()

    if (existingUser) {
      return createErrorResponse(ErrorCode.NICKNAME_TAKEN, 409)
    }

    // 4. 닉네임 저장 (DB 테이블)
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        nickname,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Set nickname error:', updateError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    // 5. Auth user_metadata에도 동기화
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { nickname }
    })

    if (authUpdateError) {
      console.error('Update auth metadata error:', authUpdateError)
      // DB는 이미 업데이트됨, 에러만 로그
    }

    // 6. 성공 응답
    return createSuccessResponse({ 
      nickname,
      message: '닉네임이 설정되었습니다'
    })
  } catch (error) {
    console.error('Set nickname error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
