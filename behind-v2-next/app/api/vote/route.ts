import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pollId, optionId, deviceHash } = body

    // 입력 검증
    const missing = validateRequired({ pollId, optionId, deviceHash })
    if (missing.length > 0) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
    }

    // Supabase RPC 함수 호출
    const { data, error } = await supabase.rpc('vote_poll', {
      p_poll_id: pollId,
      p_option_id: optionId,
      p_device_hash: deviceHash
    })

    if (error) {
      // 중복 투표 처리
      if (error.message.includes('DUPLICATE_VOTE')) {
        return createErrorResponse(ErrorCode.DUPLICATE_VOTE, 409)
      }

      // 잘못된 옵션 처리
      if (error.message.includes('INVALID_OPTION')) {
        return createErrorResponse(ErrorCode.INVALID_OPTION, 404)
      }

      console.error('Vote error:', error)
      return createErrorResponse(ErrorCode.VOTE_FAILED, 500, error.message)
    }

    return createSuccessResponse(data)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
