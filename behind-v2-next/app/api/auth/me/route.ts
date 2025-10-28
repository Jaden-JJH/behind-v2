import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCode
} from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 로그인 체크
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED, 401)
    }

    // 2. 사용자 정보 조회
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('id, email, nickname, last_nickname_change_at, created_at')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Fetch user error:', fetchError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    // 3. 성공 응답
    return createSuccessResponse({
      id: userData.id,
      email: userData.email,
      nickname: userData.nickname,
      lastNicknameChangeAt: userData.last_nickname_change_at,
      createdAt: userData.created_at
    })
  } catch (error) {
    console.error('Get user error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}