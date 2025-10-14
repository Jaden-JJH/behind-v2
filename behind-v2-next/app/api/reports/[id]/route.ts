import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse, ErrorCode, validateRequired } from '@/lib/api-error'
import { sanitizeHtml } from '@/lib/sanitize'

// 서버에서만 사용하는 Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 어드민 인증 확인
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin-auth')
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. ID 추출
    const reportId = params.id

    // 3. 요청 바디 파싱
    const body = await request.json()
    const { title, reporterName, description } = body

    // 4. XSS 방어 (sanitize)
    const sanitizedTitle = sanitizeHtml(title)
    const sanitizedReporterName = sanitizeHtml(reporterName)
    const sanitizedDescription = sanitizeHtml(description)

    // 5. 필수 필드 검증
    const missing = validateRequired({
      title: sanitizedTitle,
      reporterName: sanitizedReporterName,
      description: sanitizedDescription
    })
    if (missing.length > 0) {
      return createErrorResponse(ErrorCode.MISSING_FIELDS, 400, { missing })
    }

    // 6. 길이 및 값 검증
    if (sanitizedTitle.length < 2 || sanitizedTitle.length > 100) {
      return NextResponse.json(
        { error: '제목은 2자 이상 100자 이하여야 합니다' },
        { status: 400 }
      )
    }

    if (sanitizedReporterName.length < 2 || sanitizedReporterName.length > 20) {
      return NextResponse.json(
        { error: '제보자 닉네임은 2자 이상 20자 이하여야 합니다' },
        { status: 400 }
      )
    }

    if (sanitizedDescription.length < 2 || sanitizedDescription.length > 30) {
      return NextResponse.json(
        { error: '추가정보는 2자 이상 30자 이하여야 합니다' },
        { status: 400 }
      )
    }

    // 7. Supabase update
    const { data, error } = await supabase
      .from('reports')
      .update({
        title: sanitizedTitle,
        reporter_name: sanitizedReporterName,
        description: sanitizedDescription
      })
      .eq('id', reportId)
      .select()
      .single()

    // 8. 에러 처리
    if (error) {
      console.error('Supabase error:', error)

      // 404: 해당 ID 없음
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '해당 리포트를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      // 500: DB 에러
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    // 9. 성공 응답
    return createSuccessResponse(data, 200)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 어드민 인증 확인
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin-auth')
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. ID 추출
    const reportId = params.id

    // 3. 리포트 조회 (visibility 확인)
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('visibility')
      .eq('id', reportId)
      .single()

    if (fetchError) {
      console.error('Supabase error (fetch):', fetchError)
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '해당 리포트를 찾을 수 없습니다' },
          { status: 404 }
        )
      }
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, fetchError.message)
    }

    // 4. visibility 확인 (게시 중인 제보는 삭제 불가)
    if (report.visibility === 'active') {
      return NextResponse.json(
        { error: '게시 중인 제보는 삭제할 수 없습니다' },
        { status: 400 }
      )
    }

    // 5. Supabase delete
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)

    // 6. 에러 처리
    if (error) {
      console.error('Supabase error (delete):', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    // 7. 성공 응답
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 어드민 인증 확인
    const cookieStore = await cookies()
    const adminAuth = cookieStore.get('admin-auth')
    if (!adminAuth || adminAuth.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. ID 추출
    const reportId = params.id

    // 3. 요청 바디 파싱
    const body = await request.json()
    const { visibility } = body

    // 4. visibility 검증
    if (!visibility || !['active', 'paused'].includes(visibility)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다 (active 또는 paused만 가능)' },
        { status: 400 }
      )
    }

    // 5. Supabase update
    const { data, error } = await supabase
      .from('reports')
      .update({ visibility })
      .eq('id', reportId)
      .select()
      .single()

    // 6. 에러 처리
    if (error) {
      console.error('Supabase error:', error)

      // 404: 해당 ID 없음
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '해당 리포트를 찾을 수 없습니다' },
          { status: 404 }
        )
      }

      // 500: DB 에러
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500, error.message)
    }

    // 7. 성공 응답
    return createSuccessResponse(data, 200)
  } catch (error) {
    console.error('API error:', error)
    return createErrorResponse(ErrorCode.INTERNAL_ERROR, 500)
  }
}