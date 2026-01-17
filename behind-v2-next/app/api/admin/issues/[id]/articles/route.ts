import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { CreateArticleInput } from '@/types/issue-articles'
import { sanitizeHtml, sanitizeEmbedHTML } from '@/lib/sanitize'
import { requireAdminAuth } from '@/lib/admin-auth'

function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// POST - Create Article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth()
    const { id } = await params

    const body: CreateArticleInput = await request.json()

    // Validation
    if (!body.title || body.title.length < 1 || body.title.length > 200) {
      return NextResponse.json(
        { error: '제목은 1-200자 이내여야 합니다.' },
        { status: 400 }
      )
    }

    if (!body.url || !isValidURL(body.url)) {
      return NextResponse.json(
        { error: '유효한 URL을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!body.article_type || !['news', 'youtube', 'twitter', 'instagram'].includes(body.article_type)) {
      return NextResponse.json(
        { error: '유효한 article_type을 선택해주세요.' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      issue_id: id,
      article_type: body.article_type,
      title: sanitizeHtml(body.title),
      description: body.description ? sanitizeHtml(body.description) : null,
      url: body.url,
      source: body.source ? sanitizeHtml(body.source) : null,
      thumbnail_url: body.thumbnail_url || null,
      embed_html: body.embed_html ? sanitizeEmbedHTML(body.embed_html) : null,
      published_at: body.published_at || new Date().toISOString(),
      display_order: body.display_order ?? 0,
      is_highlighted: body.is_highlighted ?? false
    }

    const { data, error } = await supabaseAdmin
      .from('issue_articles')
      .insert(sanitizedData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to create article:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: '후속 기사 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
