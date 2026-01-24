import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { withCsrfProtection } from '@/lib/api-helpers'

// Follow an issue
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withCsrfProtection(request, async (req) => {
    try {
      const { id: issueId } = await params

      // 1. 로그인 체크
      const supabaseServer = await createServerClient()
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

      if (authError || !user) {
        return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
      }

      // 2. 이미 팔로우했는지 확인
      const { data: existingFollow, error: checkError } = await supabaseServer
        .from('issue_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('issue_id', issueId)
        .maybeSingle()

      if (checkError) {
        console.error('Check follow error:', checkError)
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, checkError.message)
      }

      if (existingFollow) {
        // 이미 팔로우한 상태 → 성공 응답 (멱등성)
        return createSuccessResponse({
          message: '이미 팔로우한 이슈입니다',
          following: true
        }, 200)
      }

      // 3. 팔로우 추가
      const { data, error } = await supabaseServer
        .from('issue_follows')
        .insert({
          user_id: user.id,
          issue_id: issueId
        })
        .select()
        .single()

      if (error) {
        console.error('Insert follow error:', error)
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
      }

      return createSuccessResponse({
        ...data,
        following: true
      }, 201)
    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}

// Unfollow an issue
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withCsrfProtection(request, async (req) => {
    try {
      const { id: issueId } = await params

      // 1. 로그인 체크
      const supabaseServer = await createServerClient()
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

      if (authError || !user) {
        return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
      }

      // 2. 팔로우 삭제
      const { error } = await supabaseServer
        .from('issue_follows')
        .delete()
        .eq('user_id', user.id)
        .eq('issue_id', issueId)

      if (error) {
        console.error('Delete follow error:', error)
        return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
      }

      return createSuccessResponse({
        message: '팔로우를 취소했습니다',
        following: false
      }, 200)
    } catch (error) {
      console.error('API error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
    }
  })
}

// Check if user is following an issue
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: issueId } = await params

    // 1. 로그인 체크
    const supabaseServer = await createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      // 비로그인 사용자 → 팔로우하지 않은 상태
      return createSuccessResponse({
        following: false
      }, 200)
    }

    // 2. 팔로우 상태 확인
    const { data: follow, error } = await supabaseServer
      .from('issue_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('issue_id', issueId)
      .maybeSingle()

    if (error) {
      console.error('Check follow error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    return createSuccessResponse({
      following: !!follow
    }, 200)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
