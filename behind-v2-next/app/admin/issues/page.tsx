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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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
  behind_story?: string
  capacity?: number
  thumbnail?: string
  poll?: {
    id: string
    question: string
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
  const [editShowInMainHot, setEditShowInMainHot] = useState(false)
  const [editShowInMainPoll, setEditShowInMainPoll] = useState(false)
  const [editBehindStory, setEditBehindStory] = useState('')
  const [editCapacity, setEditCapacity] = useState(0)
  const [editThumbnail, setEditThumbnail] = useState('')
  const [editPollQuestion, setEditPollQuestion] = useState('')
  const [editPollOptions, setEditPollOptions] = useState<string[]>(['', ''])

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
  }, [])

  async function loadIssues() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/issues?page=1&limit=50')
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

  // 폼 초기화 Helper 함수
  function initializeForm(issueData: Issue) {
    setSelectedIssue(issueData)
    setEditTitle(issueData.title)
    setEditPreview(issueData.preview || '')
    setEditSummary(issueData.summary || '')
    setEditCategory(issueData.category)
    setEditApprovalStatus(issueData.approval_status)
    setEditVisibility(issueData.visibility)
    setEditShowInMainHot(issueData.show_in_main_hot)
    setEditShowInMainPoll(issueData.show_in_main_poll)
    setEditBehindStory(issueData.behind_story || '')
    setEditCapacity(issueData.capacity || 0)
    setEditThumbnail(issueData.thumbnail || '')

    const pollData = issueData.poll
    const pollOptions = pollData?.options || []
    setEditPollQuestion(pollData?.question || '')
    setEditPollOptions(pollOptions.length > 0 ? pollOptions.map(opt => opt.label) : ['', ''])
  }

  // 수정 모달 열기
  async function openEditModal(issue: Issue) {
    try {
      // API에서 최신 투표 정보 조회
      const response = await csrfFetch(`/api/admin/issues/${issue.id}`)
      const data = await response.json()

      if (!response.ok) {
        // API 호출 실패 시 기본값으로 모달 열기
        console.error('Failed to fetch issue details:', data)
        initializeForm(issue)
        setShowEditModal(true)
        return
      }

      // 성공: API 응답 데이터로 폼 초기화
      initializeForm(data.data)
      setShowEditModal(true)
    } catch (error) {
      // 네트워크 오류 등 예외 발생 시 기본값으로 모달 열기
      console.error('Error fetching issue details:', error)
      showError(error)
      initializeForm(issue)
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
          show_in_main_hot: editShowInMainHot,
          show_in_main_poll: editShowInMainPoll,
          behind_story: editBehindStory || undefined,
          capacity: editCapacity || undefined,
          thumbnail: editThumbnail || undefined,
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

        {/* 필터/정렬 영역 (아직 동작 안 함) */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">카테고리</label>
              <Input placeholder="필터링..." className="w-40" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">승인상태</label>
              <Input placeholder="필터링..." className="w-40" disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">노출상태</label>
              <Input placeholder="필터링..." className="w-40" disabled />
            </div>
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
                  <TableHead>메인 핫</TableHead>
                  <TableHead>메인 투표</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map(issue => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.display_id}</TableCell>
                    <TableCell>{issue.title}</TableCell>
                    <TableCell>{issue.category}</TableCell>
                    <TableCell>{renderApprovalBadge(issue.approval_status)}</TableCell>
                    <TableCell>{renderVisibilityBadge(issue.visibility)}</TableCell>
                    <TableCell>{issue.view_count}</TableCell>
                    <TableCell>{issue.comment_count}</TableCell>
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
                ))}
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
                  <SelectItem value="politics">정치</SelectItem>
                  <SelectItem value="economy">경제</SelectItem>
                  <SelectItem value="entertainment">연예</SelectItem>
                  <SelectItem value="tech">IT/테크</SelectItem>
                  <SelectItem value="sports">스포츠</SelectItem>
                  <SelectItem value="society">사회</SelectItem>
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

              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editShowInMainHot}
                    onChange={(e) => setEditShowInMainHot(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">메인 화면 핫 이슈 표시</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editShowInMainPoll}
                    onChange={(e) => setEditShowInMainPoll(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">메인 화면 투표 표시</span>
                </label>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">추가 정보</h3>

              <div>
                <label className="block text-sm font-medium mb-2">Behind Story (최대 1000자)</label>
                <Textarea
                  value={editBehindStory}
                  onChange={(e) => setEditBehindStory(e.target.value)}
                  placeholder="Behind Story를 입력하세요"
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
