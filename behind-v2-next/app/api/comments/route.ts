import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 댓글 조회 (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const issueId = searchParams.get('issueId')

    if (!issueId) {
      return NextResponse.json(
        { error: 'Missing required parameter: issueId' },
        { status: 400 }
      )
    }

    // 댓글 조회 (최신순)
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: comments,
      count: comments.length
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 댓글 작성 (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { issueId, body: commentBody, userNick } = body

    // 입력 검증
    if (!issueId || !commentBody || !userNick) {
      return NextResponse.json(
        { error: 'Missing required fields: issueId, body, userNick' },
        { status: 400 }
      )
    }

    // 댓글 길이 검증
    if (commentBody.length < 2 || commentBody.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be between 2 and 500 characters' },
        { status: 400 }
      )
    }

    // 닉네임 검증
    if (userNick.length < 2 || userNick.length > 20) {
      return NextResponse.json(
        { error: 'Nickname must be between 2 and 20 characters' },
        { status: 400 }
      )
    }

    // 댓글 작성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        issue_id: issueId,
        body: commentBody,
        user_nick: userNick
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
