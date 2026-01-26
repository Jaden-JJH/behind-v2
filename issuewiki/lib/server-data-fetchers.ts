/**
 * 서버 컴포넌트용 데이터 페칭 함수
 * API 라우트를 거치지 않고 직접 Supabase에서 데이터를 가져와 성능 향상
 */

import { createClient } from '@supabase/supabase-js'
import { normalizeCategory } from './categories'
import { getChatRoomStates } from './chat-service'

// 서버 전용 Supabase 클라이언트
const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * 메인 페이지 활성 이슈 조회
 * 캐싱: 60초마다 갱신
 */
export async function fetchActiveIssues() {
  const supabase = getSupabaseClient()

  const { data: issues, error } = await supabase
    .from('issues')
    .select(`
      *,
      poll:polls(
        id,
        question,
        seed_total,
        batch_min,
        batch_max,
        is_blinded,
        blinded_at,
        options:poll_options(
          id,
          label,
          vote_count
        )
      )
    `)
    .eq('visibility', 'active')
    .or('show_in_main_hot.eq.true,show_in_main_poll.eq.true')
    .order('show_in_main_hot', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(0, 1) // 최대 2개

  if (error) {
    console.error('Failed to fetch active issues:', error)
    return []
  }

  return (issues || []).map((issue) => ({
    ...issue,
    category: normalizeCategory(issue.category)
  }))
}


/**
 * 투표용 이슈 조회 (블라인드되지 않은 것만)
 */
export async function fetchPollIssues() {
  const supabase = getSupabaseClient()

  const { data: issues, error } = await supabase
    .from('issues')
    .select(`
      *,
      poll:polls(
        id,
        question,
        seed_total,
        batch_min,
        batch_max,
        is_blinded,
        blinded_at,
        options:poll_options(
          id,
          label,
          vote_count
        )
      )
    `)
    .eq('status', 'active')
    .eq('visibility', 'active')
    .eq('show_in_main_poll', true)
    .range(0, 1) // 최대 2개

  if (error) {
    console.error('Failed to fetch poll issues:', error)
    return []
  }

  // 블라인드되지 않은 투표만 필터링
  return (issues || [])
    .filter(issue => {
      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
      return poll && !poll.is_blinded
    })
    .map((issue) => ({
      ...issue,
      category: normalizeCategory(issue.category)
    }))
}

/**
 * 지나간 이슈 조회
 */
export async function fetchPastIssues(limit = 5) {
  const supabase = getSupabaseClient()

  const { data: issues, error } = await supabase
    .from('issues')
    .select('id, display_id, title, created_at, view_count, comment_count')
    .eq('approval_status', 'approved')
    .eq('status', 'active')
    .eq('visibility', 'active')
    .order('created_at', { ascending: false })
    .range(0, limit - 1)

  if (error) {
    console.error('Failed to fetch past issues:', error)
    return []
  }

  return issues || []
}

/**
 * 실시간 인기 이슈 조회
 */
export async function fetchTrendingIssues() {
  const supabase = getSupabaseClient()

  try {
    // 1. 어드민 설정에서 조회
    const { data: settingsData, error: settingsError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'realtime_trending')
      .single()

    if (!settingsError && settingsData?.value) {
      const settings = settingsData.value
      const issueIds = [
        settings.slot_1?.issue_id,
        settings.slot_2?.issue_id,
        settings.slot_3?.issue_id,
        settings.slot_4?.issue_id,
        settings.slot_5?.issue_id
      ].filter(Boolean)

      if (issueIds.length > 0) {
        const { data: issues, error: issuesError } = await supabase
          .from('issues')
          .select('id, display_id, title, category')
          .in('id', issueIds)
          .eq('approval_status', 'approved')
          .eq('visibility', 'active')

        if (!issuesError && issues) {
          // 순서대로 정렬 + 변동 수치 추가
          const issueMap = new Map(issues.map(issue => [issue.id, issue]))
          const result = []

          for (let i = 1; i <= 5; i++) {
            const slotKey = `slot_${i}`
            const slotData = settings[slotKey]

            if (slotData?.issue_id && issueMap.has(slotData.issue_id)) {
              const issue = issueMap.get(slotData.issue_id)!
              result.push({
                id: issue.id,
                display_id: issue.display_id,
                title: issue.title,
                rank: i,
                change: slotData.change || '0'
              })
            }
          }

          if (result.length > 0) {
            return result
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch trending from settings:', err)
  }

  // 어드민 설정이 비어있으면 빈 배열 반환 (영역 숨김)
  return []
}

/**
 * 롤링 배너 이슈 조회
 */
export async function fetchBannerIssues() {
  const supabase = getSupabaseClient()

  const { data: issues, error } = await supabase
    .from('issues')
    .select('id, display_id, title, show_in_banner_slot1, show_in_banner_slot2, show_in_banner_slot3')
    .eq('status', 'active')
    .eq('visibility', 'active')
    .or('show_in_banner_slot1.eq.true,show_in_banner_slot2.eq.true,show_in_banner_slot3.eq.true')
    .order('display_id', { ascending: true }) // 일관된 순서 보장

  if (error) {
    console.error('Failed to fetch banner issues:', error)
    return []
  }

  // 슬롯별로 첫 번째 매칭되는 이슈만 선택 (중복 방지)
  const slot1 = issues?.find(issue => issue.show_in_banner_slot1)
  const slot2 = issues?.find(issue => issue.show_in_banner_slot2)
  const slot3 = issues?.find(issue => issue.show_in_banner_slot3)

  // 슬롯 순서대로 배열 구성
  const bannerIssues = []
  if (slot1) bannerIssues.push({ id: slot1.id, display_id: slot1.display_id, title: slot1.title, position: 1 })
  if (slot2) bannerIssues.push({ id: slot2.id, display_id: slot2.display_id, title: slot2.title, position: 2 })
  if (slot3) bannerIssues.push({ id: slot3.id, display_id: slot3.display_id, title: slot3.title, position: 3 })

  return bannerIssues
}

/**
 * 캐러셀 이슈 조회
 */
export async function fetchCarouselIssues() {
  const supabase = getSupabaseClient()

  const { data: issues, error } = await supabase
    .from('issues')
    .select('id, display_id, title, preview, thumbnail, created_at, show_in_carousel_slot1, show_in_carousel_slot2, show_in_carousel_slot3, show_in_carousel_slot4, show_in_carousel_slot5')
    .eq('approval_status', 'approved')
    .eq('visibility', 'active')
    .or('show_in_carousel_slot1.eq.true,show_in_carousel_slot2.eq.true,show_in_carousel_slot3.eq.true,show_in_carousel_slot4.eq.true,show_in_carousel_slot5.eq.true')
    .order('display_id', { ascending: true })

  if (error) {
    console.error('Failed to fetch carousel issues:', error)
    return []
  }

  // 슬롯별로 첫 번째 매칭되는 이슈만 선택 (중복 방지)
  const slot1 = issues?.find(issue => issue.show_in_carousel_slot1)
  const slot2 = issues?.find(issue => issue.show_in_carousel_slot2)
  const slot3 = issues?.find(issue => issue.show_in_carousel_slot3)
  const slot4 = issues?.find(issue => issue.show_in_carousel_slot4)
  const slot5 = issues?.find(issue => issue.show_in_carousel_slot5)

  // 슬롯 순서대로 배열 구성
  const carouselIssues = []
  if (slot1) carouselIssues.push({ id: slot1.id, display_id: slot1.display_id, title: slot1.title, preview: slot1.preview, thumbnail: slot1.thumbnail, created_at: slot1.created_at, position: 1 })
  if (slot2) carouselIssues.push({ id: slot2.id, display_id: slot2.display_id, title: slot2.title, preview: slot2.preview, thumbnail: slot2.thumbnail, created_at: slot2.created_at, position: 2 })
  if (slot3) carouselIssues.push({ id: slot3.id, display_id: slot3.display_id, title: slot3.title, preview: slot3.preview, thumbnail: slot3.thumbnail, created_at: slot3.created_at, position: 3 })
  if (slot4) carouselIssues.push({ id: slot4.id, display_id: slot4.display_id, title: slot4.title, preview: slot4.preview, thumbnail: slot4.thumbnail, created_at: slot4.created_at, position: 4 })
  if (slot5) carouselIssues.push({ id: slot5.id, display_id: slot5.display_id, title: slot5.title, preview: slot5.preview, thumbnail: slot5.thumbnail, created_at: slot5.created_at, position: 5 })

  return carouselIssues
}

/**
 * 제보된 이슈 조회
 */
export async function fetchReportedIssues(deviceHash?: string, userId?: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('visibility', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch reports:', error)
    return []
  }

  if (!data) {
    return []
  }

  // is_curious 필드 추가 (deviceHash 또는 userId 있을 때)
  if (deviceHash || userId) {
    const reportIds = data.map(r => r.id)

    if (reportIds.length > 0) {
      // device_hash 또는 user_id로 체크
      let curiousReportIds: string[] = []

      // device_hash로 체크
      if (deviceHash) {
        const { data: curiousData, error: curiousError } = await supabase
          .from('report_curious')
          .select('report_id')
          .eq('device_hash', deviceHash)
          .in('report_id', reportIds)

        if (!curiousError && curiousData) {
          curiousReportIds = [...curiousReportIds, ...curiousData.map(r => r.report_id)]
        }
      }

      // user_id로도 체크 (로그인 사용자가 다른 기기에서 누른 경우 포함)
      if (userId) {
        const { data: curiousDataByUser, error: curiousErrorByUser } = await supabase
          .from('report_curious')
          .select('report_id')
          .eq('user_id', userId)
          .in('report_id', reportIds)

        if (!curiousErrorByUser && curiousDataByUser) {
          curiousReportIds = [...curiousReportIds, ...curiousDataByUser.map(r => r.report_id)]
        }
      }

      const curiousSet = new Set(curiousReportIds)
      const allReports = data.map(report => ({
        ...report,
        is_curious: curiousSet.has(report.id)
      }))
      // 랜덤하게 셔플하여 10개만 반환 (서버에서 한 번만)
      return allReports.sort(() => 0.5 - Math.random()).slice(0, 10)
    }
  }

  const allReports = data.map(report => ({ ...report, is_curious: false }))

  // 랜덤하게 셔플하여 3개만 반환 (서버에서 한 번만)
  return allReports.sort(() => 0.5 - Math.random()).slice(0, 10)
}

/**
 * 채팅방 상태 조회 (배치)
 * chat-service의 getChatRoomStates를 활용하여 정확한 상태 반환
 */
export async function fetchChatRoomStates(issueIds: string[]) {
  if (issueIds.length === 0) return {}

  try {
    const states = await getChatRoomStates(issueIds)

    // 배열을 객체로 변환 (issueId를 키로)
    const result: Record<string, any> = {}
    states.forEach(state => {
      result[state.issueId] = state
    })

    return result
  } catch (error) {
    console.error('Failed to fetch chat room states:', error)
    return {}
  }
}

/**
 * 이슈 상세 정보 조회 (상세 페이지용)
 */
export async function fetchIssueDetail(displayId: string) {
  const supabase = getSupabaseClient()

  // 숫자인지 확인
  const displayIdNum = parseInt(displayId, 10)
  if (isNaN(displayIdNum)) {
    return null
  }

  const { data, error } = await supabase
    .from('issues')
    .select(`
      *,
      poll:polls(
        id,
        question,
        seed_total,
        batch_min,
        batch_max,
        is_blinded,
        blinded_at,
        options:poll_options(
          id,
          label,
          vote_count
        )
      )
    `)
    .eq('display_id', displayIdNum)
    .single()

  if (error) {
    console.error('Failed to fetch issue detail:', error)
    return null
  }

  // 노출 중지된 이슈는 접근 차단
  if (data?.visibility === 'paused') {
    return null
  }

  return {
    ...data,
    category: normalizeCategory(data.category)
  }
}

/**
 * 조회수 증가 (서버 컴포넌트용)
 */
export async function incrementIssueViewCount(issueId: string) {
  // 서버 컴포넌트에서는 service role key 사용 불가
  // 대신 API 라우트를 호출하거나, edge function 사용
  // 여기서는 간단히 anon key로 시도 (RLS 정책에 따라 동작)
  const supabase = getSupabaseClient()

  try {
    // RPC 함수로 조회수 증가 (원자적 연산)
    const { error } = await supabase.rpc('increment_view_count', { issue_id: issueId })
    if (error) {
      console.error('Failed to increment view count:', error)
    }
  } catch (error) {
    console.error('Failed to increment view count:', error)
  }
}

/**
 * 이슈 상세 페이지 전체 데이터 조회
 */
export async function fetchIssueDetailPageData(displayId: string) {
  // 먼저 이슈 조회
  const issue = await fetchIssueDetail(displayId)

  if (!issue) {
    return null
  }

  // issue.id (UUID)로 후속 기사 조회
  const articles = await fetchIssueArticles(issue.id)

  // 채팅방 상태 조회
  const chatStates = await fetchChatRoomStates([issue.id])
  const chatState = chatStates[issue.id] || null

  return {
    issue,
    articles,
    chatState
  }
}

/**
 * 이슈 후속 기사 조회
 */
export async function fetchIssueArticles(issueId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('issue_articles')
    .select('*')
    .eq('issue_id', issueId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch issue articles:', error)
    return []
  }

  return data || []
}

/**
 * 전체 이슈 목록 조회 (이슈 목록 페이지용)
 */
export async function fetchAllIssuesWithChat() {
  const supabase = getSupabaseClient()

  const { data: issues, error } = await supabase
    .from('issues')
    .select(`
      *,
      poll:polls(
        id,
        question,
        seed_total,
        batch_min,
        batch_max,
        is_blinded,
        blinded_at,
        options:poll_options(
          id,
          label,
          vote_count
        )
      )
    `)
    .eq('approval_status', 'approved')
    .eq('visibility', 'active')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Failed to fetch all issues:', error)
    return { issues: [], chatStates: {} }
  }

  const normalizedIssues = (issues || []).map((issue) => ({
    ...issue,
    category: normalizeCategory(issue.category)
  }))

  // 채팅방 상태 조회
  const issueIds = normalizedIssues.map(i => i.id).filter(Boolean)
  const chatStates = await fetchChatRoomStates(issueIds)

  return {
    issues: normalizedIssues,
    chatStates
  }
}

/**
 * 이슈 검색 (검색 페이지용)
 */
export async function searchIssues(query: string, limit = 50) {
  if (!query || query.trim().length === 0) {
    return []
  }

  const supabase = getSupabaseClient()
  const searchQuery = query.trim()

  const { data, error } = await supabase
    .from('issues')
    .select('id, display_id, title, preview, category, created_at, view_count')
    .eq('approval_status', 'approved')
    .eq('status', 'active')
    .eq('visibility', 'active')
    .or(`title.ilike.%${searchQuery}%,preview.ilike.%${searchQuery}%`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to search issues:', error)
    return []
  }

  return (data || []).map((issue) => ({
    ...issue,
    category: normalizeCategory(issue.category)
  }))
}

/**
 * 메인 페이지 전체 데이터 병렬 조회
 */
export async function fetchLandingPageData(deviceHash?: string, userId?: string) {
  const [
    activeIssues,
    pollIssues,
    pastIssues,
    trendingIssues,
    reportedIssues,
    bannerIssues,
    carouselIssues
  ] = await Promise.all([
    fetchActiveIssues(),
    fetchPollIssues(),
    fetchPastIssues(5),
    fetchTrendingIssues(),
    fetchReportedIssues(deviceHash, userId),
    fetchBannerIssues(),
    fetchCarouselIssues()
  ])

  // 활성 이슈의 채팅방 상태 조회
  const issueIds = activeIssues.map(i => i.id).filter(Boolean)
  const chatStates = await fetchChatRoomStates(issueIds)

  return {
    activeIssues,
    pollIssues,
    pastIssues,
    trendingIssues,
    reportedIssues,
    bannerIssues,
    carouselIssues,
    chatStates
  }
}
