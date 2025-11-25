import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // 1. 로그인 체크
    const supabaseServer = await createServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return createErrorResponse(ErrorCode.LOGIN_REQUIRED, 401)
    }

    // 2. URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 3. 내가 쓴 댓글 가져오기 (이슈 정보 포함)
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        body,
        up,
        down,
        created_at,
        issue_id,
        issues:issue_id (
          id,
          display_id,
          title,
          thumbnail
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (commentsError) {
      console.error('Comments fetch error:', commentsError)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, commentsError.message)
    }

    // 필터: issue 정보가 있는 댓글만 유지 (삭제된 이슈는 제외)
    const validComments = (comments || []).filter(comment => {
      if (!comment.issues) {
        console.warn(`Comment ${comment.id} has no associated issue (issue might be deleted)`)
        return false
      }
      return true
    })

    // 4. 전체 개수 조회 (페이지네이션)
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Count error:', countError)
    }

    const total = count || 0

    return createSuccessResponse({
      comments: validComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, 200, total)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
