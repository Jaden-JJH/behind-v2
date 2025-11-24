import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { UpdateArticleInput } from '@/types/issue-articles'
import { sanitizeHtml, sanitizeEmbedHTML } from '@/lib/sanitize'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  if (authCookie?.value !== 'true') throw new Error('Unauthorized')
  return true
}

// PUT - Update Article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    await checkAdminAuth()
    const { id, articleId } = await params

    const body: UpdateArticleInput = await request.json()

    // Build update object
    const updateData: any = {}

    if (body.title) updateData.title = sanitizeHtml(body.title)
    if (body.description !== undefined) {
      updateData.description = body.description ? sanitizeHtml(body.description) : null
    }
    if (body.url) updateData.url = body.url
    if (body.source !== undefined) {
      updateData.source = body.source ? sanitizeHtml(body.source) : null
    }
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url
    if (body.embed_html !== undefined) {
      updateData.embed_html = body.embed_html ? sanitizeEmbedHTML(body.embed_html) : null
    }
    if (body.published_at !== undefined) updateData.published_at = body.published_at
    if (body.display_order !== undefined) updateData.display_order = body.display_order
    if (body.is_highlighted !== undefined) updateData.is_highlighted = body.is_highlighted
    if (body.article_type) updateData.article_type = body.article_type

    const { data, error } = await supabaseAdmin
      .from('issue_articles')
      .update(updateData)
      .eq('id', articleId)
      .eq('issue_id', id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: '후속 기사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to update article:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    return NextResponse.json(
      { error: '후속 기사 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE - Delete Article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    await checkAdminAuth()
    const { id, articleId } = await params

    const { error } = await supabaseAdmin
      .from('issue_articles')
      .delete()
      .eq('id', articleId)
      .eq('issue_id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: '후속 기사가 삭제되었습니다.'
    })
  } catch (error: any) {
    console.error('Failed to delete article:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
    }

    return NextResponse.json(
      { error: '후속 기사 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
