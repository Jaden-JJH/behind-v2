/**
 * 9번 이슈의 후속 기사 확인 및 썸네일 테스트
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkIssue9() {
  console.log('🔍 9번 이슈 확인\n')
  console.log('─'.repeat(70))

  try {
    // 1. 9번 이슈 정보 조회
    console.log('\n📋 1단계: 이슈 정보 조회\n')

    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (issuesError) {
      console.error('❌ 이슈 조회 실패:', issuesError.message)
      return
    }

    console.log(`전체 이슈 ${issues?.length}개 발견\n`)

    // 이슈명으로 검색
    const issue9 = issues?.find(i =>
      i.title?.includes('캄보디아') ||
      i.title?.includes('도발') ||
      i.title?.includes('한국인')
    )

    if (!issue9) {
      console.log('⚠️ 캄보디아 관련 이슈를 찾을 수 없습니다.')
      console.log('\n최근 이슈 목록:')
      issues?.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.title} (ID: ${issue.id})`)
      })
      return
    }

    console.log('✅ 이슈 발견:')
    console.log(`   제목: ${issue9.title}`)
    console.log(`   ID: ${issue9.id}`)
    console.log()

    // 2. 해당 이슈의 후속 기사 조회
    console.log('📰 2단계: 후속 기사 조회\n')

    const { data: articles, error: articlesError } = await supabase
      .from('issue_articles')
      .select('*')
      .eq('issue_id', issue9.id)
      .order('display_order', { ascending: true })

    if (articlesError) {
      console.error('❌ 후속 기사 조회 실패:', articlesError.message)
      return
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️ 후속 기사가 없습니다.')
      return
    }

    console.log(`총 ${articles.length}개의 후속 기사 발견\n`)

    for (const article of articles) {
      console.log('─'.repeat(70))
      console.log(`\n📰 ${article.title}`)
      console.log(`   ID: ${article.id}`)
      console.log(`   타입: ${article.article_type}`)
      console.log(`   하이라이트: ${article.is_highlighted ? '✅ Yes' : '❌ No'}`)
      console.log(`   썸네일 URL: ${article.thumbnail_url || '(없음)'}`)

      if (article.thumbnail_url) {
        console.log('\n   🔍 썸네일 상세 분석:')

        try {
          // URL 파싱
          const url = new URL(article.thumbnail_url)
          console.log(`   ✅ URL 형식: 유효`)
          console.log(`   - 전체 URL: ${article.thumbnail_url}`)
          console.log(`   - 프로토콜: ${url.protocol}`)
          console.log(`   - 호스트: ${url.hostname}`)
          console.log(`   - 경로: ${url.pathname}`)
          console.log(`   - 쿼리: ${url.search || '(없음)'}`)

          // 이미지 접근 테스트
          console.log('\n   📡 이미지 접근 테스트:')

          const response = await fetch(article.thumbnail_url, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          })

          console.log(`   - HTTP 상태: ${response.status} ${response.statusText}`)
          console.log(`   - Content-Type: ${response.headers.get('content-type') || '(없음)'}`)
          console.log(`   - Content-Length: ${response.headers.get('content-length') || '(없음)'} bytes`)
          console.log(`   - CORS Header: ${response.headers.get('access-control-allow-origin') || '(없음)'}`)

          if (response.ok) {
            console.log(`   ✅ 이미지 접근 성공!`)

            // 실제 GET 요청으로 이미지 다운로드 테스트
            console.log('\n   📥 실제 이미지 다운로드 테스트:')
            const getResponse = await fetch(article.thumbnail_url)

            if (getResponse.ok) {
              const blob = await getResponse.blob()
              console.log(`   ✅ 다운로드 성공! (크기: ${blob.size} bytes)`)
            } else {
              console.log(`   ❌ 다운로드 실패: ${getResponse.status}`)
            }
          } else {
            console.log(`   ❌ 이미지 접근 실패`)

            if (response.status === 403) {
              console.log(`   💡 원인: 접근 권한 없음 (403 Forbidden)`)
              console.log(`   💡 해결: CORS 설정 또는 다른 이미지 URL 사용`)
            } else if (response.status === 404) {
              console.log(`   💡 원인: 이미지가 존재하지 않음 (404 Not Found)`)
            }
          }

        } catch (error: any) {
          console.log(`   ❌ 오류: ${error.message}`)
        }
      }

      console.log()
    }

    // 3. 테스트용 썸네일 추가
    console.log('─'.repeat(70))
    console.log('\n🧪 3단계: 테스트 이미지 추가\n')

    const testArticle = articles.find(a => !a.thumbnail_url && a.is_highlighted)

    if (testArticle) {
      console.log(`테스트 대상: ${testArticle.title}`)
      console.log(`현재 썸네일: ${testArticle.thumbnail_url || '(없음)'}`)
      console.log('\n테스트 이미지 URL 추가 중...')

      const testImageUrl = 'https://picsum.photos/800/600'

      const { data: updated, error: updateError } = await supabase
        .from('issue_articles')
        .update({ thumbnail_url: testImageUrl })
        .eq('id', testArticle.id)
        .select()
        .single()

      if (updateError) {
        console.log(`❌ 업데이트 실패: ${updateError.message}`)
      } else {
        console.log(`✅ 썸네일 추가 성공!`)
        console.log(`새 URL: ${testImageUrl}`)
        console.log('\n브라우저에서 확인해보세요:')
        console.log(`http://localhost:3002/issues/${issue9.id}`)
      }
    } else {
      console.log('⚠️ 썸네일이 없는 하이라이트 기사를 찾을 수 없습니다.')
    }

    console.log('\n─'.repeat(70))
    console.log('✅ 분석 완료\n')

  } catch (error: any) {
    console.error('❌ 오류:', error.message)
  }
}

checkIssue9()
