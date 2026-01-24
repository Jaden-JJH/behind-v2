import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCode
} from '@/lib/api-error'

export async function PUT(request: NextRequest) {
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

    // 3. 현재 사용자 정보 조회
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('nickname, last_nickname_change_at')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Fetch user error:', fetchError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    // 4. 30일 제한 체크
    if (currentUser.last_nickname_change_at) {
      const lastChange = new Date(currentUser.last_nickname_change_at)
      const now = new Date()
      const daysDiff = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff < 30) {
        const nextChangeDate = new Date(lastChange)
        nextChangeDate.setDate(nextChangeDate.getDate() + 30)
        
        return createErrorResponse(
          ErrorCode.NICKNAME_CHANGE_TOO_SOON, 
          403,
          { nextChangeDate: nextChangeDate.toISOString() }
        )
      }
    }

    // 5. 중복 체크 (자신의 닉네임 제외)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      return createErrorResponse(ErrorCode.NICKNAME_TAKEN, 409)
    }

    // 6. 닉네임 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        nickname,
        last_nickname_change_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update nickname error:', updateError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    // 7. 성공 응답
    return createSuccessResponse({ 
      nickname,
      message: '닉네임이 변경되었습니다'
    })
  } catch (error) {
    console.error('Update nickname error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}