import { createClient } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'
import { curiousLimiter, getClientIp } from '@/lib/rate-limiter'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Rate Limiting
    const ip = getClientIp(request)
    const { success, limit, remaining, reset } = await curiousLimiter.limit(ip)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    // 2. 요청 바디 파싱
    const body = await request.json()
    const { deviceHash } = body
    const reportId = params.id

    // 3. 입력 검증
    const missing = validateRequired({ reportId, deviceHash })
    if (missing.length > 0) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
    }

    // 4. Supabase RPC 함수 호출
    const { data, error } = await supabase.rpc('curious_report', {
      p_report_id: reportId,
      p_device_hash: deviceHash
    })

    if (error) {
      // 중복 체크
      if (error.message.includes('ALREADY_CURIOUS')) {
        return NextResponse.json(
          { error: '이미 궁금해요를 누르셨습니다' },
          { status: 409 }
        )
      }

      console.error('Curious error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    // 5. 100% 달성 체크 및 status 변경
    const result = data[0]
    let statusUpdated = false

    if (result.curious_count >= result.threshold && result.status === 'active') {
      const { error: statusError } = await supabase
        .from('reports')
        .update({ status: 'pending' })
        .eq('id', reportId)

      if (!statusError) {
        statusUpdated = true
      } else {
        console.error('Status update error:', statusError)
      }
    }

    // 6. 성공 응답
    return createSuccessResponse({
      curious_count: result.curious_count,
      threshold: result.threshold,
      is_complete: result.curious_count >= result.threshold,
      status_updated: statusUpdated
    }, 200)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}
