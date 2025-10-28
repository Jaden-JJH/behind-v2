import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/api-error'
import { normalizeCategory } from '@/lib/categories'

// 서버에서만 사용하는 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeAll = searchParams.get('includeAll') === 'true'
    const statusParam = searchParams.get('status')

    // Supabase 쿼리 빌더
    let query = supabase
      .from('issues')
      .select(`
        *,
        poll:polls(
          id,
          question,
          seed_total,
          batch_min,
          batch_max,
          options:poll_options(
            id,
            label,
            vote_count
          )
        )
      `)

    // includeAll 여부에 따라 필터 및 정렬 적용
    if (includeAll) {
      query = query.order('created_at', { ascending: false })

      if (!statusParam || statusParam === 'active') {
        query = query.eq('status', 'active')
      } else if (statusParam === 'all') {
        // no status filter, include every status value
      } else {
        query = query.eq('status', statusParam)
      }
    } else {
      query = query
        .or('show_in_main_hot.eq.true,show_in_main_poll.eq.true')
        .order('show_in_main_hot', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
    }

    const { data: issues, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      return createErrorResponse(ErrorCode.ISSUE_FETCH_FAILED, 500, error.message)
    }

    const normalizedIssues = (issues || []).map((issue) => ({
      ...issue,
      category: normalizeCategory(issue.category)
    }))

    return createSuccessResponse(normalizedIssues, 200, normalizedIssues.length)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
