import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  if (authCookie?.value !== 'true') throw new Error('Unauthorized')
  return true
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuth()
    const { id: issueId } = await params

    const { articleIds }: { articleIds: string[] } = await request.json()

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      )
    }

    // Update display_order for each article
    const updates = articleIds.map((id, index) =>
      supabaseAdmin
        .from('issue_articles')
        .update({ display_order: index })
        .eq('id', id)
        .eq('issue_id', issueId)
    )

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: '순서가 변경되었습니다.'
    })
  } catch (error: any) {
    console.error('Failed to reorder articles:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    return NextResponse.json(
      { error: '순서 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}
