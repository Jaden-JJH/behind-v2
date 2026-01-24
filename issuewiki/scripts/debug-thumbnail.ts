/**
 * 썸네일 이미지가 표시되지 않는 원인 디버깅
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugThumbnails() {
  console.log('🔍 썸네일 이미지 디버깅\n')
  console.log('─'.repeat(70))

  try {
    // 모든 후속 기사 조회
    const { data: articles, error } = await supabase
      .from('issue_articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 조회 실패:', error.message)
      return
    }

    if (!articles || articles.length === 0) {
      console.log('후속 기사가 없습니다.')
      return
    }

    console.log(`\n총 ${articles.length}개의 후속 기사 발견\n`)

    for (const article of articles) {
      console.log('─'.repeat(70))
      console.log(`\n📰 ${article.title}`)
      console.log(`   ID: ${article.id}`)
      console.log(`   타입: ${article.article_type}`)
      console.log(`   하이라이트: ${article.is_highlighted ? 'Yes' : 'No'}`)
      console.log(`   썸네일 URL: ${article.thumbnail_url || '(없음)'}`)

      if (article.thumbnail_url) {
        // 썸네일 URL 유효성 검사
        console.log('\n   🔍 썸네일 URL 분석:')

        try {
          const url = new URL(article.thumbnail_url)
          console.log(`   ✅ URL 형식: 유효`)
          console.log(`   - 프로토콜: ${url.protocol}`)
          console.log(`   - 호스트: ${url.hostname}`)
          console.log(`   - 경로: ${url.pathname}`)

          // 실제 이미지 접근 시도
          console.log('\n   📡 이미지 접근 테스트 중...')

          const response = await fetch(article.thumbnail_url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          })

          console.log(`   - 상태 코드: ${response.status} ${response.statusText}`)
          console.log(`   - Content-Type: ${response.headers.get('content-type') || '(없음)'}`)
          console.log(`   - Content-Length: ${response.headers.get('content-length') || '(없음)'} bytes`)

          if (response.ok) {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.startsWith('image/')) {
              console.log(`   ✅ 이미지 접근 성공! (${contentType})`)
            } else {
              console.log(`   ⚠️ 경고: Content-Type이 이미지가 아님 (${contentType})`)
            }
          } else {
            console.log(`   ❌ 이미지 접근 실패: ${response.status} ${response.statusText}`)

            if (response.status === 403) {
              console.log(`   💡 가능한 원인: CORS 정책 또는 접근 권한 문제`)
            } else if (response.status === 404) {
              console.log(`   💡 가능한 원인: 이미지가 존재하지 않음`)
            }
          }

          // CORS 헤더 확인
          const corsHeader = response.headers.get('access-control-allow-origin')
          if (corsHeader) {
            console.log(`   - CORS: ${corsHeader}`)
          } else {
            console.log(`   ⚠️ CORS 헤더 없음 (브라우저에서 차단될 수 있음)`)
          }

        } catch (urlError: any) {
          console.log(`   ❌ URL 형식 오류: ${urlError.message}`)
        }
      } else {
        console.log(`   ℹ️ 썸네일 URL이 설정되지 않음`)
      }

      console.log()
    }

    console.log('─'.repeat(70))
    console.log('\n✅ 디버깅 완료\n')

    // 요약
    const withThumbnail = articles.filter(a => a.thumbnail_url)
    const highlighted = articles.filter(a => a.is_highlighted)

    console.log('📊 요약:')
    console.log(`   - 전체 기사: ${articles.length}개`)
    console.log(`   - 썸네일 있음: ${withThumbnail.length}개`)
    console.log(`   - 하이라이트: ${highlighted.length}개`)
    console.log()

  } catch (error: any) {
    console.error('❌ 오류:', error.message)
  }
}

debugThumbnails()
