import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCode
} from '@/lib/api-error'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 로그인 체크
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED, 401)
    }

    // 2. 현재 사용자 정보 조회
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('id, deleted_at, nickname')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Fetch user error:', fetchError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }

    // 3. 이미 탈퇴한 계정 체크
    if (currentUser.deleted_at) {
      return createErrorResponse(ErrorCode.ACCOUNT_ALREADY_DELETED, 400)
    }

    // 4. Soft Delete 처리
    const userId8Chars = user.id.replace(/-/g, '').substring(0, 8)
    const anonymizedNickname = `탈퇴한사용자_${userId8Chars}`
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        nickname: anonymizedNickname,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Delete account error:', updateError)
      return createErrorResponse(ErrorCode.ACCOUNT_DELETE_FAILED, 500)
    }

    // 5. Supabase Auth 세션 종료
    await supabase.auth.signOut()

    // 6. 성공 응답
    return createSuccessResponse({ 
      message: '회원 탈퇴가 완료되었습니다'
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}