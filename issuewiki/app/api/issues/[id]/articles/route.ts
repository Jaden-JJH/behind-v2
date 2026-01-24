import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { IssueArticle } from '@/types/issue-articles'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // Fetch articles
    const { data: articles, error, count } = await supabase
      .from('issue_articles')
      .select('*', { count: 'exact' })
      .eq('issue_id', id)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data: articles as IssueArticle[],
      total: count || 0
    })
  } catch (error: any) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json(
      { error: '후속 기사를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
