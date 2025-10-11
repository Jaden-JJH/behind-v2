import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { sanitizeFields, sanitizeHtml } from '@/lib/sanitize'

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

  // XSS 방어: 텍스트 필드 정제
  const sanitized = sanitizeFields(
    {
      title,
      preview,
      summary,
      mediaNewsTitle,
      mediaNewsSource,
      behindStory,
      pollQuestion
    },
    ['title', 'preview', 'summary', 'mediaNewsTitle', 'mediaNewsSource', 'behindStory', 'pollQuestion']
  )

  // 투표 옵션도 정제
  const sanitizedOptions = options?.map((opt: string) => sanitizeHtml(opt))

  try {
    // 1. slug 생성 (제목을 URL-friendly하게 변환)
    const slug = sanitized.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    // 2. media_embed JSON 생성
    const mediaEmbed: any = {}
    if (mediaYoutube) {
      mediaEmbed.youtube = mediaYoutube
    }
    if (sanitized.mediaNewsTitle && mediaNewsUrl) {
      mediaEmbed.news = {
        title: sanitized.mediaNewsTitle,
        source: sanitized.mediaNewsSource || '',
        url: mediaNewsUrl
      }
    }

    // 3. 이슈 생성
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        slug,
        title: sanitized.title,
        preview: sanitized.preview,
        summary: sanitized.summary || null,
        thumbnail: thumbnail || null,
        capacity,
        category: 'general',
        status: 'active',
        media_embed: Object.keys(mediaEmbed).length > 0 ? mediaEmbed : null,
        behind_story: sanitized.behindStory || null,
        show_in_main_hot: showInMainHot || false,
        show_in_main_poll: showInMainPoll || false
      })
      .select()
      .single()

    if (issueError) throw issueError

    // 4. 투표 생성 (선택 사항)
    if (sanitized.pollQuestion && sanitizedOptions && sanitizedOptions.length >= 2) {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          issue_id: issue.id,
          question: sanitized.pollQuestion
        })
        .select()
        .single()

      if (pollError) throw pollError

      // 5. 투표 옵션 생성
      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(
          sanitizedOptions.map((text: string) => ({
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
