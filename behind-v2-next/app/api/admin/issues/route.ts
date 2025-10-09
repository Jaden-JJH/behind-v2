import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  // 인증 확인
  const authCookie = cookies().get('admin-auth')
  if (authCookie?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const {
    title,
    preview,
    thumbnail,
    capacity,
    summary,
    mediaYoutube,
    mediaNewsTitle,
    mediaNewsSource,
    mediaNewsUrl,
    behindStory,
    pollQuestion,
    options,
    showInMainHot,
    showInMainPoll
  } = await request.json()

  try {
    // 1. slug 생성 (제목을 URL-friendly하게 변환)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    // 2. media_embed JSON 생성
    const mediaEmbed: any = {}
    if (mediaYoutube) {
      mediaEmbed.youtube = mediaYoutube
    }
    if (mediaNewsTitle && mediaNewsUrl) {
      mediaEmbed.news = {
        title: mediaNewsTitle,
        source: mediaNewsSource || '',
        url: mediaNewsUrl
      }
    }

    // 3. 이슈 생성
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        slug,
        title,
        preview,
        summary: summary || null,
        thumbnail: thumbnail || null,
        capacity,
        category: 'general',
        status: 'active',
        media_embed: Object.keys(mediaEmbed).length > 0 ? mediaEmbed : null,
        behind_story: behindStory || null,
        show_in_main_hot: showInMainHot || false,
        show_in_main_poll: showInMainPoll || false
      })
      .select()
      .single()

    if (issueError) throw issueError

    // 4. 투표 생성 (선택 사항)
    if (pollQuestion && options && options.length >= 2) {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          issue_id: issue.id,
          question: pollQuestion
        })
        .select()
        .single()

      if (pollError) throw pollError

      // 5. 투표 옵션 생성
      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(
          options.map((text: string) => ({
            poll_id: poll.id,
            label: text
          }))
        )

      if (optionsError) throw optionsError
    }

    // 6. 채팅방 생성
    const { error: roomError } = await supabase
      .from('rooms')
      .insert({
        issue_id: issue.id,
        capacity
      })

    if (roomError) throw roomError

    return NextResponse.json({ 
      success: true, 
      issue,
      message: '이슈가 성공적으로 등록되었습니다'
    })

  } catch (error: any) {
    console.error('Issue creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create issue' },
      { status: 500 }
    )
  }
}
