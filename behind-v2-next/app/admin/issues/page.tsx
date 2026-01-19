'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { showSuccess, showError } from '@/lib/toast-utils'
import { csrfFetch } from '@/lib/csrf-client'
import { CATEGORY_KO_VALUES } from '@/lib/categories'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArticleFormFields, type ArticleFormData } from '@/components/admin/article-form-fields'
import { ShieldAlert, AlertCircle } from 'lucide-react'

// 카테고리 매핑 (프론트엔드 표시값 → DB 저장값)
const CATEGORY_OPTIONS = CATEGORY_KO_VALUES.map((value) => ({
  value,
  label: value
}))

// 인터페이스 정의
interface Issue {
  id: string
  display_id: number
  title: string
  preview: string
  summary: string
  category: string
  approval_status: 'pending' | 'approved' | 'rejected'
  visibility: 'active' | 'paused'
  view_count: number
  comment_count: number
  show_in_main_hot: boolean
  show_in_main_poll: boolean
  is_blinded?: boolean
  blinded_at?: string
  report_count?: number
  behind_story?: string
  capacity?: number
  thumbnail?: string
  poll?: {
    id: string
    question: string
    is_blinded?: boolean
    blinded_at?: string
    report_count?: number
    options: Array<{
      id: string
      label: string
    }>
  }
  created_at: string
}

export default function AdminIssuesPage() {
  const router = useRouter()

  // 목록 상태
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  // 모달 상태
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // 선택된 이슈
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  // 수정 폼 상태
  const [submitting, setSubmitting] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editPreview, setEditPreview] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editApprovalStatus, setEditApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [editVisibility, setEditVisibility] = useState<'active' | 'paused'>('active')
  const [editBehindStory, setEditBehindStory] = useState('')
  const [editCapacity, setEditCapacity] = useState(0)
  const [editThumbnail, setEditThumbnail] = useState('')
  const [editPollQuestion, setEditPollQuestion] = useState('')
  const [editPollOptions, setEditPollOptions] = useState<string[]>(['', ''])
  const [editMediaYoutube, setEditMediaYoutube] = useState('')
  const [editMediaNewsTitle, setEditMediaNewsTitle] = useState('')
  const [editMediaNewsSource, setEditMediaNewsSource] = useState('')
  const [editMediaNewsUrl, setEditMediaNewsUrl] = useState('')
  const [editArticles, setEditArticles] = useState<ArticleFormData[]>([])

  // 메인 노출 설정 상태
  const [mainHotSlot1, setMainHotSlot1] = useState<string>('')
  const [mainHotSlot2, setMainHotSlot2] = useState<string>('')
  const [mainPollSlot1, setMainPollSlot1] = useState<string>('')
  const [mainPollSlot2, setMainPollSlot2] = useState<string>('')
  const [savingMainDisplay, setSavingMainDisplay] = useState(false)

  // 실시간 인기 이슈 상태 (새로 추가)
  const [realtimeSlot1, setRealtimeSlot1] = useState<string>('')
  const [realtimeSlot1Change, setRealtimeSlot1Change] = useState<string>('0')
  const [realtimeSlot2, setRealtimeSlot2] = useState<string>('')
  const [realtimeSlot2Change, setRealtimeSlot2Change] = useState<string>('0')
  const [realtimeSlot3, setRealtimeSlot3] = useState<string>('')
  const [realtimeSlot3Change, setRealtimeSlot3Change] = useState<string>('0')
  const [realtimeSlot4, setRealtimeSlot4] = useState<string>('')
  const [realtimeSlot4Change, setRealtimeSlot4Change] = useState<string>('0')
  const [realtimeSlot5, setRealtimeSlot5] = useState<string>('')
  const [realtimeSlot5Change, setRealtimeSlot5Change] = useState<string>('0')
  const [savingRealtimeTrending, setSavingRealtimeTrending] = useState(false)

  // 롤링 배너 상태
  const [bannerSlot1, setBannerSlot1] = useState<string>('')
  const [bannerSlot2, setBannerSlot2] = useState<string>('')
  const [bannerSlot3, setBannerSlot3] = useState<string>('')
  const [savingBannerDisplay, setSavingBannerDisplay] = useState(false)

  // 캐러셀 상태
  const [carouselSlot1, setCarouselSlot1] = useState<string>('')
  const [carouselSlot2, setCarouselSlot2] = useState<string>('')
  const [carouselSlot3, setCarouselSlot3] = useState<string>('')
  const [carouselSlot4, setCarouselSlot4] = useState<string>('')
  const [carouselSlot5, setCarouselSlot5] = useState<string>('')
  const [savingCarouselDisplay, setSavingCarouselDisplay] = useState(false)

  // 필터 상태
  const [filterCategory, setFilterCategory] = useState('')
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('')
  const [filterVisibility, setFilterVisibility] = useState('')

  // 인증 확인
  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => {
        if (!res.ok) router.push('/admin/login')
      })
  }, [router])

  // 목록 조회
  useEffect(() => {
    loadIssues()
    loadMainDisplayIssues()
    loadRealtimeTrending() // 새로 추가
    loadBannerDisplay() // 배너 로드
    loadCarouselDisplay() // 캐러셀 로드
  }, [])

  async function loadIssues() {
    try {
      setLoading(true)

      // 필터 파라미터 구성
    const params = new URLSearchParams({
      page: '1',
      limit: '50'
    })

    if (filterCategory) {
      params.append('category', filterCategory)
    }

      if (filterApprovalStatus) params.append('approval', filterApprovalStatus)
      if (filterVisibility) params.append('visibility', filterVisibility)

      const response = await fetch(`/api/admin/issues?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      setIssues(data.data || [])
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  // 메인 노출 이슈 로드
  async function loadMainDisplayIssues() {
    try {
      const response = await fetch('/api/admin/issues?approval=approved&limit=100')
      const data = await response.json()

      if (!response.ok || !data.data) return

      const mainIssues = data.data
      const hotIssues = mainIssues.filter((issue: any) => issue.show_in_main_hot)
      const pollIssues = mainIssues.filter((issue: any) => issue.show_in_main_poll)

      setMainHotSlot1(hotIssues[0]?.id || '')
      setMainHotSlot2(hotIssues[1]?.id || '')
      setMainPollSlot1(pollIssues[0]?.id || '')
      setMainPollSlot2(pollIssues[1]?.id || '')
    } catch (error) {
      console.error('Failed to load main display issues:', error)
    }
  }

  // 실시간 인기 이슈 로드
  async function loadRealtimeTrending() {
    try {
      const response = await fetch('/api/admin/issues/realtime-trending')
      const data = await response.json()

      if (!response.ok || !data.data) return

      const settings = data.data
      setRealtimeSlot1(settings.slot_1?.issue_id || '')
      setRealtimeSlot1Change(settings.slot_1?.change || '0')
      setRealtimeSlot2(settings.slot_2?.issue_id || '')
      setRealtimeSlot2Change(settings.slot_2?.change || '0')
      setRealtimeSlot3(settings.slot_3?.issue_id || '')
      setRealtimeSlot3Change(settings.slot_3?.change || '0')
      setRealtimeSlot4(settings.slot_4?.issue_id || '')
      setRealtimeSlot4Change(settings.slot_4?.change || '0')
      setRealtimeSlot5(settings.slot_5?.issue_id || '')
      setRealtimeSlot5Change(settings.slot_5?.change || '0')
    } catch (error) {
      console.error('Failed to load realtime trending:', error)
    }
  }

  // 배너 설정 로드
  async function loadBannerDisplay() {
    try {
      const response = await fetch('/api/admin/issues/banner-display')
      const data = await response.json()

      if (!response.ok || !data.data) return

      const bannerSlots = data.data
      setBannerSlot1(bannerSlots.slot1?.id || '')
      setBannerSlot2(bannerSlots.slot2?.id || '')
      setBannerSlot3(bannerSlots.slot3?.id || '')
    } catch (error) {
      console.error('Failed to load banner display:', error)
    }
  }

  // 캐러셀 설정 로드
  async function loadCarouselDisplay() {
    try {
      const response = await fetch('/api/admin/issues/carousel-display')
      const data = await response.json()

      if (!response.ok || !data.data) return

      const carouselSlots = data.data
      setCarouselSlot1(carouselSlots.slot1?.id || '')
      setCarouselSlot2(carouselSlots.slot2?.id || '')
      setCarouselSlot3(carouselSlots.slot3?.id || '')
      setCarouselSlot4(carouselSlots.slot4?.id || '')
      setCarouselSlot5(carouselSlots.slot5?.id || '')
    } catch (error) {
      console.error('Failed to load carousel display:', error)
    }
  }

  // 메인 노출 설정 저장
  async function handleSaveMainDisplay() {
    try {
      setSavingMainDisplay(true)

      const response = await csrfFetch('/api/admin/issues/main-display', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotSlot1: mainHotSlot1 || null,
          hotSlot2: mainHotSlot2 || null,
          pollSlot1: mainPollSlot1 || null,
          pollSlot2: mainPollSlot2 || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      showSuccess('메인 노출 설정이 저장되었습니다')
      loadIssues()
    } catch (error) {
      showError(error)
    } finally {
      setSavingMainDisplay(false)
    }
  }

  // 실시간 인기 이슈 저장
  async function handleSaveRealtimeTrending() {
    try {
      setSavingRealtimeTrending(true)

      const response = await csrfFetch('/api/admin/issues/realtime-trending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_1: {
            issue_id: realtimeSlot1 || null,
            change: realtimeSlot1Change
          },
          slot_2: {
            issue_id: realtimeSlot2 || null,
            change: realtimeSlot2Change
          },
          slot_3: {
            issue_id: realtimeSlot3 || null,
            change: realtimeSlot3Change
          },
          slot_4: {
            issue_id: realtimeSlot4 || null,
            change: realtimeSlot4Change
          },
          slot_5: {
            issue_id: realtimeSlot5 || null,
            change: realtimeSlot5Change
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      showSuccess('실시간 인기 이슈가 저장되었습니다')
    } catch (error) {
      showError(error)
    } finally {
      setSavingRealtimeTrending(false)
    }
  }

  // 배너 설정 저장
  async function handleSaveBannerDisplay() {
    try {
      setSavingBannerDisplay(true)

      const response = await csrfFetch('/api/admin/issues/banner-display', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot1: bannerSlot1 || null,
          slot2: bannerSlot2 || null,
          slot3: bannerSlot3 || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      showSuccess('롤링 배너 설정이 저장되었습니다')
    } catch (error) {
      showError(error)
    } finally {
      setSavingBannerDisplay(false)
    }
  }

  // 캐러셀 설정 저장
  async function handleSaveCarouselDisplay() {
    try {
      setSavingCarouselDisplay(true)

      const response = await csrfFetch('/api/admin/issues/carousel-display', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot1: carouselSlot1 || null,
          slot2: carouselSlot2 || null,
          slot3: carouselSlot3 || null,
          slot4: carouselSlot4 || null,
          slot5: carouselSlot5 || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      showSuccess('캐러셀 설정이 저장되었습니다')
    } catch (error) {
      showError(error)
    } finally {
      setSavingCarouselDisplay(false)
    }
  }

  // 필터 핸들러
  function handleCategoryChange(value: string) {
    setFilterCategory(value === 'all' ? '' : value)
    // loadIssues()는 useEffect에서 호출됨
  }

  function handleApprovalStatusChange(value: string) {
    setFilterApprovalStatus(value === 'all' ? '' : value)
    // loadIssues()는 useEffect에서 호출됨
  }

  function handleVisibilityChange(value: string) {
    setFilterVisibility(value === 'all' ? '' : value)
    // loadIssues()는 useEffect에서 호출됨
  }

  function handleResetFilters() {
    setFilterCategory('')
    setFilterApprovalStatus('')
    setFilterVisibility('')
    // loadIssues()는 useEffect에서 호출됨
  }

  // 필터 변경 시 목록 재조회
  useEffect(() => {
    loadIssues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterApprovalStatus, filterVisibility])

  // 폼 초기화 Helper 함수
  function initializeForm(issueData: Issue) {
    setSelectedIssue(issueData)
    setEditTitle(issueData.title)
    setEditPreview(issueData.preview || '')
    setEditSummary(issueData.summary || '')
    setEditCategory(issueData.category || '')
    setEditApprovalStatus(issueData.approval_status)
    setEditVisibility(issueData.visibility)
    setEditBehindStory(issueData.behind_story || '')
    setEditCapacity(issueData.capacity || 0)
    setEditThumbnail(issueData.thumbnail || '')

    // media_embed 파싱
    const mediaEmbed = (issueData as any).media_embed || {}
    setEditMediaYoutube(mediaEmbed.youtube || '')
    setEditMediaNewsTitle(mediaEmbed.news?.title || '')
    setEditMediaNewsSource(mediaEmbed.news?.source || '')
    setEditMediaNewsUrl(mediaEmbed.news?.url || '')

    const pollData = issueData.poll
    if (pollData) {
      setEditPollQuestion(pollData.question || '')
      // API는 poll_options (snake_case) 반환
      const pollOptions = (pollData as any).poll_options || pollData.options || []
      setEditPollOptions(pollOptions.length > 0 ? pollOptions.map((opt: any) => opt.label) : ['', ''])
    } else {
      setEditPollQuestion('')
      setEditPollOptions(['', ''])
    }
  }

  // 수정 모달 열기
  async function openEditModal(issue: Issue) {
    try {
      console.log('[DEBUG] openEditModal - issue:', issue)

      // API에서 최신 투표 정보 조회
      const response = await csrfFetch(`/api/admin/issues/${issue.id}`)
      const data = await response.json()

      console.log('[DEBUG] API response:', data)

      if (!response.ok) {
        // API 호출 실패 시 기본값으로 모달 열기
        console.error('Failed to fetch issue details:', data)
        setSelectedIssue(issue)
        initializeForm(issue)
        setShowEditModal(true)
        return
      }

      // 성공: API 응답 데이터로 폼 초기화하고 selectedIssue도 업데이트
      const latestIssue = data.data
      console.log('[DEBUG] latestIssue:', latestIssue)
      console.log('[DEBUG] latestIssue.poll:', latestIssue.poll)

      setSelectedIssue(latestIssue)
      initializeForm(latestIssue)

      // 후속 기사 불러오기
      try {
        const articlesResponse = await fetch(`/api/issues/${issue.id}/articles`)
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json()
          const loadedArticles = (articlesData.data || []).map((article: any) => ({
            id: article.id,
            article_type: article.article_type,
            title: article.title,
            description: article.description || '',
            url: article.url,
            source: article.source || '',
            thumbnail_url: article.thumbnail_url || '',
            published_at: article.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : '',
            is_highlighted: article.is_highlighted
          }))
          setEditArticles(loadedArticles)
        }
      } catch (articleError) {
        console.error('Failed to fetch articles:', articleError)
        setEditArticles([])
      }

      setShowEditModal(true)
    } catch (error) {
      // 네트워크 오류 등 예외 발생 시 기본값으로 모달 열기
      console.error('Error fetching issue details:', error)
      showError(error)
      setSelectedIssue(issue)
      initializeForm(issue)
      setEditArticles([])
      setShowEditModal(true)
    }
  }

  // 수정 핸들러
  async function handleEdit() {
    if (!selectedIssue) return

    // 유효성 검증
    if (!editTitle.trim()) {
      showError('제목을 입력해주세요')
      return
    }

    if (editTitle.length < 5 || editTitle.length > 100) {
      showError('제목은 5자 이상 100자 이하여야 합니다')
      return
    }

    if (!editPreview.trim()) {
      showError('미리보기를 입력해주세요')
      return
    }

    if (editPreview.length < 10 || editPreview.length > 200) {
      showError('미리보기는 10자 이상 200자 이하여야 합니다')
      return
    }

    if (editSummary.length > 500) {
      showError('요약은 500자 이하여야 합니다')
      return
    }

    if (!editCategory) {
      showError('카테고리를 선택해주세요')
      return
    }

    // 투표 검증 (투표가 있으면 질문과 옵션 필수)
    if (editPollQuestion.trim()) {
      if (editPollOptions.filter(opt => opt.trim()).length < 2) {
        showError('투표 옵션은 최소 2개 이상 필요합니다')
        return
      }
    }

    try {
      setSubmitting(true)

      // media_embed 구성
      const mediaEmbed: any = {}
      if (editMediaYoutube) {
        mediaEmbed.youtube = editMediaYoutube
      }
      if (editMediaNewsTitle && editMediaNewsUrl) {
        mediaEmbed.news = {
          title: editMediaNewsTitle,
          source: editMediaNewsSource || '',
          url: editMediaNewsUrl
        }
      }

      const response = await csrfFetch(`/api/admin/issues/${selectedIssue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          preview: editPreview,
          summary: editSummary,
          category: editCategory,
          approval_status: editApprovalStatus,
          visibility: editVisibility,
          behind_story: editBehindStory || undefined,
          capacity: editCapacity || undefined,
          thumbnail: editThumbnail || undefined,
          media_embed: Object.keys(mediaEmbed).length > 0 ? mediaEmbed : undefined,
          ...(editPollQuestion.trim() && {
            poll: {
              question: editPollQuestion,
              options: editPollOptions.filter(opt => opt.trim())
            }
          })
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      // 후속 기사 업데이트
      try {
        // 1. 기존 후속 기사 목록 가져오기
        const existingArticlesRes = await fetch(`/api/issues/${selectedIssue.id}/articles`)
        const existingArticlesData = existingArticlesRes.ok ? await existingArticlesRes.json() : { data: [] }
        const existingArticles = existingArticlesData.data || []
        const existingIds = existingArticles.map((a: any) => a.id)

        // 2. 삭제된 기사 제거
        const currentIds = editArticles.map(a => a.id).filter(Boolean)
        const deletedIds = existingIds.filter((id: string) => !currentIds.includes(id))

        for (const deletedId of deletedIds) {
          await csrfFetch(`/api/admin/issues/${selectedIssue.id}/articles/${deletedId}`, {
            method: 'DELETE'
          })
        }

        // 3. 기사 생성/수정
        for (const [index, article] of editArticles.entries()) {
          if (article.id) {
            // 기존 기사 수정
            await csrfFetch(`/api/admin/issues/${selectedIssue.id}/articles/${article.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...article,
                display_order: index
              })
            })
          } else {
            // 새 기사 생성
            await csrfFetch(`/api/admin/issues/${selectedIssue.id}/articles`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...article,
                display_order: index
              })
            })
          }
        }
      } catch (articleError) {
        console.error('Failed to update articles:', articleError)
        showError('이슈는 수정되었으나 후속 기사 업데이트에 실패했습니다.')
        setShowEditModal(false)
        loadIssues()
        return
      }

      showSuccess('이슈가 수정되었습니다')
      setShowEditModal(false)
      loadIssues()
    } catch (error) {
      showError(error)
    } finally {
      setSubmitting(false)
    }
  }

  // 삭제 모달 열기
  function openDeleteModal(issue: Issue) {
    setSelectedIssue(issue)
    setShowDeleteModal(true)
  }

  // 삭제 핸들러
  async function handleDelete() {
    if (!selectedIssue) return

    // 게시 중인 이슈는 삭제 불가
    if (selectedIssue.visibility === 'active') {
      showError('게시 중인 이슈는 삭제할 수 없습니다. 먼저 중지한 후 삭제 가능합니다')
      return
    }

    try {
      setSubmitting(true)
      const response = await csrfFetch(`/api/admin/issues/${selectedIssue.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        showError(data)
        return
      }

      showSuccess('이슈가 삭제되었습니다')
      setShowDeleteModal(false)
      loadIssues()
    } catch (error) {
      showError(error)
    } finally {
      setSubmitting(false)
    }
  }

  // 승인상태 뱃지 렌더링
  function renderApprovalBadge(approvalStatus: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      pending: '대기',
      approved: '승인',
      rejected: '거부'
    }

    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${colors[approvalStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[approvalStatus as keyof typeof labels] || approvalStatus}
      </span>
    )
  }

  // 노출상태 뱃지 렌더링
  function renderVisibilityBadge(visibility: string) {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      active: '게시중',
      paused: '중지'
    }

    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${colors[visibility as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[visibility as keyof typeof labels] || visibility}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">이슈 관리</h1>
        </div>

        {/* 필터/정렬 영역 */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">카테고리</label>
              <Select value={filterCategory || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">승인상태</label>
              <Select value={filterApprovalStatus || 'all'} onValueChange={handleApprovalStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기</SelectItem>
                  <SelectItem value="approved">승인</SelectItem>
                  <SelectItem value="rejected">거부</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">노출상태</label>
              <Select value={filterVisibility || 'all'} onValueChange={handleVisibilityChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">게시중</SelectItem>
                  <SelectItem value="paused">중지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button variant="outline" onClick={handleResetFilters}>
                초기화
              </Button>
            </div>
          </div>
        </Card>

        {/* 메인 노출 설정 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📌 메인 페이지 노출 설정</h2>
          <p className="text-sm text-gray-600 mb-4">
            메인 페이지에 표시될 이슈를 선택하세요. 승인된 이슈만 선택 가능합니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HOT 이슈 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">🔥 HOT 이슈</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">HOT 이슈 #1</label>
                  <Select value={mainHotSlot1} onValueChange={setMainHotSlot1}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택 안함" />
                    </SelectTrigger>
                    <SelectContent>
                      {issues
                        .filter((issue) => {
                          const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                          return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                        })
                        .map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            [{issue.display_id}] {issue.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">HOT 이슈 #2</label>
                  <Select value={mainHotSlot2} onValueChange={setMainHotSlot2}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택 안함" />
                    </SelectTrigger>
                    <SelectContent>
                      {issues
                        .filter((issue) => {
                          const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                          return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                        })
                        .map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            [{issue.display_id}] {issue.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 투표 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">📊 투표</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">투표 #1</label>
                  <Select value={mainPollSlot1} onValueChange={setMainPollSlot1}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택 안함" />
                    </SelectTrigger>
                    <SelectContent>
                      {issues
                        .filter((issue) => {
                          const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                          return issue.approval_status === 'approved' && poll && !poll.is_blinded
                        })
                        .map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            [{issue.display_id}] {issue.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">투표 #2</label>
                  <Select value={mainPollSlot2} onValueChange={setMainPollSlot2}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택 안함" />
                    </SelectTrigger>
                    <SelectContent>
                      {issues
                        .filter((issue) => {
                          const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                          return issue.approval_status === 'approved' && poll && !poll.is_blinded
                        })
                        .map((issue) => (
                          <SelectItem key={issue.id} value={issue.id}>
                            [{issue.display_id}] {issue.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveMainDisplay} disabled={savingMainDisplay}>
              {savingMainDisplay ? '저장 중...' : '저장'}
            </Button>
          </div>
        </Card>

        {/* 롤링 배너 관리 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🔥 롤링 배너 관리 (Breaking News)</h2>
          <p className="text-sm text-gray-600 mb-4">
            메인 페이지 상단에 표시될 속보 배너를 설정하세요. 최대 3개까지 등록 가능하며, 2개 이상일 경우 1.5초마다 자동으로 롤링됩니다.
            <br />
            <span className="text-rose-600 font-medium">승인된 이슈만 선택 가능</span>하며, 아무것도 등록하지 않으면 배너가 표시되지 않습니다.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">배너 슬롯 #1</label>
              <Select value={bannerSlot1 || 'none'} onValueChange={(value) => setBannerSlot1(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">배너 슬롯 #2</label>
              <Select value={bannerSlot2 || 'none'} onValueChange={(value) => setBannerSlot2(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">배너 슬롯 #3</label>
              <Select value={bannerSlot3 || 'none'} onValueChange={(value) => setBannerSlot3(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveBannerDisplay} disabled={savingBannerDisplay}>
              {savingBannerDisplay ? '저장 중...' : '저장'}
            </Button>
          </div>
        </Card>

        {/* 캐러셀 관리 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🎠 캐러셀 관리</h2>
          <p className="text-sm text-gray-600 mb-4">
            메인 페이지 상단 캐러셀에 표시될 이슈를 설정하세요. 최대 5개까지 등록 가능합니다.
            <br />
            <span className="text-rose-600 font-medium">승인된 이슈만 선택 가능</span>하며, 아무것도 등록하지 않으면 캐러셀이 표시되지 않습니다.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">캐러셀 슬롯 #1</label>
              <Select value={carouselSlot1 || 'none'} onValueChange={(value) => setCarouselSlot1(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">캐러셀 슬롯 #2</label>
              <Select value={carouselSlot2 || 'none'} onValueChange={(value) => setCarouselSlot2(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">캐러셀 슬롯 #3</label>
              <Select value={carouselSlot3 || 'none'} onValueChange={(value) => setCarouselSlot3(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">캐러셀 슬롯 #4</label>
              <Select value={carouselSlot4 || 'none'} onValueChange={(value) => setCarouselSlot4(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">캐러셀 슬롯 #5</label>
              <Select value={carouselSlot5 || 'none'} onValueChange={(value) => setCarouselSlot5(value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택 안함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  {issues
                    .filter((issue) => {
                      const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                      return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                    })
                    .map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        [{issue.display_id}] {issue.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveCarouselDisplay} disabled={savingCarouselDisplay}>
              {savingCarouselDisplay ? '저장 중...' : '저장'}
            </Button>
          </div>
        </Card>

        {/* 실시간 인기 이슈 관리 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">⚡ 실시간 인기 이슈 관리</h2>
          <p className="text-sm text-gray-600 mb-4">
            홈페이지 실시간 인기 이슈 영역에 표시될 이슈를 선택하세요. 승인된 이슈만 선택 가능합니다.
          </p>

          <div className="space-y-4">
            {/* 슬롯 1 */}
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">1위</label>
                <Select value={realtimeSlot1} onValueChange={setRealtimeSlot1}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues
                      .filter((issue) => {
                        const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                        return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                      })
                      .map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          [{issue.display_id}] {issue.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">변동</label>
                <Input
                  value={realtimeSlot1Change}
                  onChange={(e) => setRealtimeSlot1Change(e.target.value)}
                  placeholder="예: +5, -2"
                  maxLength={10}
                />
              </div>
            </div>

            {/* 슬롯 2 */}
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">2위</label>
                <Select value={realtimeSlot2} onValueChange={setRealtimeSlot2}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues
                      .filter((issue) => {
                        const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                        return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                      })
                      .map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          [{issue.display_id}] {issue.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">변동</label>
                <Input
                  value={realtimeSlot2Change}
                  onChange={(e) => setRealtimeSlot2Change(e.target.value)}
                  placeholder="예: +5, -2"
                  maxLength={10}
                />
              </div>
            </div>

            {/* 슬롯 3 */}
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">3위</label>
                <Select value={realtimeSlot3} onValueChange={setRealtimeSlot3}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues
                      .filter((issue) => {
                        const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                        return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                      })
                      .map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          [{issue.display_id}] {issue.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">변동</label>
                <Input
                  value={realtimeSlot3Change}
                  onChange={(e) => setRealtimeSlot3Change(e.target.value)}
                  placeholder="예: +5, -2"
                  maxLength={10}
                />
              </div>
            </div>

            {/* 슬롯 4 */}
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">4위</label>
                <Select value={realtimeSlot4} onValueChange={setRealtimeSlot4}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues
                      .filter((issue) => {
                        const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                        return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                      })
                      .map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          [{issue.display_id}] {issue.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">변동</label>
                <Input
                  value={realtimeSlot4Change}
                  onChange={(e) => setRealtimeSlot4Change(e.target.value)}
                  placeholder="예: +5, -2"
                  maxLength={10}
                />
              </div>
            </div>

            {/* 슬롯 5 */}
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">5위</label>
                <Select value={realtimeSlot5} onValueChange={setRealtimeSlot5}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    {issues
                      .filter((issue) => {
                        const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                        return issue.approval_status === 'approved' && !issue.is_blinded && !poll?.is_blinded
                      })
                      .map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          [{issue.display_id}] {issue.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium mb-1">변동</label>
                <Input
                  value={realtimeSlot5Change}
                  onChange={(e) => setRealtimeSlot5Change(e.target.value)}
                  placeholder="예: +5, -2"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveRealtimeTrending} disabled={savingRealtimeTrending}>
              {savingRealtimeTrending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </Card>

        {/* 테이블 */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600">
              로딩 중...
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              등록된 이슈가 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>승인상태</TableHead>
                  <TableHead>노출상태</TableHead>
                  <TableHead>조회수</TableHead>
                  <TableHead>댓글수</TableHead>
                  <TableHead>신고</TableHead>
                  <TableHead>메인 핫</TableHead>
                  <TableHead>메인 투표</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map(issue => {
                  const poll = Array.isArray(issue.poll) ? issue.poll[0] : issue.poll
                  const isBlinded = issue.is_blinded || poll?.is_blinded
                  const totalReports = (issue.report_count || 0) + (poll?.report_count || 0)

                  return (
                    <TableRow
                      key={issue.id}
                      className={isBlinded ? 'bg-red-50' : ''}
                    >
                      <TableCell className="font-medium">{issue.display_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{issue.title}</span>
                          {issue.is_blinded && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded-md text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              이슈 블라인드
                            </span>
                          )}
                          {poll?.is_blinded && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-300 rounded-md text-xs font-medium">
                              <ShieldAlert className="w-3 h-3" />
                              투표 블라인드
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{issue.category}</TableCell>
                      <TableCell>{renderApprovalBadge(issue.approval_status)}</TableCell>
                      <TableCell>{renderVisibilityBadge(issue.visibility)}</TableCell>
                      <TableCell>{issue.view_count}</TableCell>
                      <TableCell>{issue.comment_count}</TableCell>
                      <TableCell>
                        {totalReports > 0 ? (
                          <span className="text-red-600 font-semibold">{totalReports}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>{issue.show_in_main_hot ? '예' : '아니오'}</TableCell>
                      <TableCell>{issue.show_in_main_poll ? '예' : '아니오'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(issue)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(issue)}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* 수정 모달 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>이슈 수정</DialogTitle>
            <DialogDescription>
              이슈 정보를 수정합니다. 투표가 1개 이상 있으면 투표 옵션을 수정할 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 기본 정보 */}
            <div>
              <label className="block text-sm font-medium mb-2">제목 (5-100자)</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{editTitle.length}/100자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">미리보기 (10-200자)</label>
              <Textarea
                value={editPreview}
                onChange={(e) => setEditPreview(e.target.value)}
                placeholder="미리보기를 입력하세요"
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{editPreview.length}/200자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">요약 (최대 500자)</label>
              <Textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="요약을 입력하세요"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{editSummary.length}/500자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">카테고리</label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 상태 정보 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">상태 정보</h3>

              <div>
                <label className="block text-sm font-medium mb-2">승인 상태</label>
                <Select value={editApprovalStatus} onValueChange={(value: any) => setEditApprovalStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">대기</SelectItem>
                    <SelectItem value="approved">승인</SelectItem>
                    <SelectItem value="rejected">거부</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">노출 상태</label>
                <Select value={editVisibility} onValueChange={(value: any) => setEditVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">게시중</SelectItem>
                    <SelectItem value="paused">중지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">추가 정보</h3>

              <div>
                <label className="block text-sm font-medium mb-2">에디터 노트 (최대 1000자)</label>
                <Textarea
                  value={editBehindStory}
                  onChange={(e) => setEditBehindStory(e.target.value)}
                  placeholder="에디터 노트를 입력하세요"
                  maxLength={1000}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">{editBehindStory.length}/1000자</p>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">정원</label>
                <Input
                  type="number"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value) || 0)}
                  placeholder="정원을 입력하세요"
                  min="0"
                />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">썸네일 URL</label>
                <Input
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  placeholder="이미지 URL"
                />
              </div>
            </div>

            {/* 미디어 정보 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">미디어 정보</h3>

              <div>
                <label className="block text-sm font-medium mb-2">유튜브 URL</label>
                <Input
                  value={editMediaYoutube}
                  onChange={(e) => setEditMediaYoutube(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">뉴스 제목</label>
                <Input
                  value={editMediaNewsTitle}
                  onChange={(e) => setEditMediaNewsTitle(e.target.value)}
                  placeholder="뉴스 제목"
                />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">뉴스 출처</label>
                <Input
                  value={editMediaNewsSource}
                  onChange={(e) => setEditMediaNewsSource(e.target.value)}
                  placeholder="예: 연합뉴스"
                />
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">뉴스 URL</label>
                <Input
                  value={editMediaNewsUrl}
                  onChange={(e) => setEditMediaNewsUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* 투표 정보 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">투표 정보</h3>

              <div>
                <label className="block text-sm font-medium mb-2">투표 질문</label>
                <Input
                  value={editPollQuestion}
                  onChange={(e) => setEditPollQuestion(e.target.value)}
                  placeholder="투표 질문을 입력하세요 (비워두면 투표 없음)"
                />
              </div>

              {editPollQuestion.trim() && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2">투표 옵션 (최소 2개)</label>
                  <div className="space-y-2">
                    {editPollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...editPollOptions]
                            newOptions[index] = e.target.value
                            setEditPollOptions(newOptions)
                          }}
                          placeholder={`옵션 ${index + 1}`}
                        />
                        {editPollOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditPollOptions(editPollOptions.filter((_, i) => i !== index))
                            }}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditPollOptions([...editPollOptions, ''])}
                    >
                      + 옵션 추가
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 후속 기사 섹션 */}
            <div className="border-t pt-4">
              <ArticleFormFields articles={editArticles} onChange={setEditArticles} />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 모달 */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이슈 삭제</DialogTitle>
            <DialogDescription>
              정말 삭제하시겠습니까? 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">제목:</span> {selectedIssue?.title}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">카테고리:</span> {selectedIssue?.category}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
