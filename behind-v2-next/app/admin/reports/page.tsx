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

// 인터페이스 정의
interface ReportedIssue {
  id: number
  title: string
  reporter_name: string
  description: string
  curious_count: number
  threshold: number
  status: 'active' | 'paused' | 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminReportsPage() {
  const router = useRouter()

  // 목록 상태
  const [reports, setReports] = useState<ReportedIssue[]>([])
  const [loading, setLoading] = useState(true)

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // 폼 상태
  const [selectedReport, setSelectedReport] = useState<ReportedIssue | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Create 폼
  const [createTitle, setCreateTitle] = useState('')
  const [createReporterName, setCreateReporterName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createThreshold, setCreateThreshold] = useState('200')

  // Edit 폼
  const [editTitle, setEditTitle] = useState('')
  const [editReporterName, setEditReporterName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // 인증 확인
  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => {
        if (!res.ok) router.push('/admin/login')
      })
  }, [router])

  // 목록 조회
  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    try {
      setLoading(true)
      const response = await fetch('/api/reports')
      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      setReports(data.data || [])
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  // 등록
  async function handleCreate() {
    if (!createTitle.trim() || !createReporterName.trim() || !createDescription.trim()) {
      showError('모든 필드를 입력해주세요')
      return
    }

    if (createTitle.length < 2 || createTitle.length > 100) {
      showError('제목은 2자 이상 100자 이하여야 합니다')
      return
    }

    if (createReporterName.length < 2 || createReporterName.length > 20) {
      showError('제보자 닉네임은 2자 이상 20자 이하여야 합니다')
      return
    }

    if (createDescription.length < 2 || createDescription.length > 30) {
      showError('추가정보는 2자 이상 30자 이하여야 합니다')
      return
    }

    const threshold = parseInt(createThreshold)
    if (isNaN(threshold) || threshold < 10) {
      showError('정원은 최소 10명 이상이어야 합니다')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle,
          reporterName: createReporterName,
          description: createDescription,
          threshold: threshold
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      showSuccess('등록되었습니다')
      setShowCreateModal(false)

      // 폼 초기화
      setCreateTitle('')
      setCreateReporterName('')
      setCreateDescription('')
      setCreateThreshold('200')

      loadReports()
    } catch (error) {
      showError(error)
    } finally {
      setSubmitting(false)
    }
  }

  // 수정 모달 열기
  function openEditModal(report: ReportedIssue) {
    setSelectedReport(report)
    setEditTitle(report.title)
    setEditReporterName(report.reporter_name)
    setEditDescription(report.description)
    setShowEditModal(true)
  }

  // 수정
  async function handleEdit() {
    if (!selectedReport) return

    if (!editTitle.trim() || !editReporterName.trim() || !editDescription.trim()) {
      showError('모든 필드를 입력해주세요')
      return
    }

    if (editTitle.length < 2 || editTitle.length > 100) {
      showError('제목은 2자 이상 100자 이하여야 합니다')
      return
    }

    if (editReporterName.length < 2 || editReporterName.length > 20) {
      showError('제보자 닉네임은 2자 이상 20자 이하여야 합니다')
      return
    }

    if (editDescription.length < 2 || editDescription.length > 30) {
      showError('추가정보는 2자 이상 30자 이하여야 합니다')
      return
    }

    if (!window.confirm('수정하시겠습니까?')) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          reporterName: editReporterName,
          description: editDescription
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      showSuccess('수정되었습니다')
      setShowEditModal(false)
      loadReports()
    } catch (error) {
      showError(error)
    } finally {
      setSubmitting(false)
    }
  }

  // 삭제 모달 열기
  function openDeleteModal(report: ReportedIssue) {
    setSelectedReport(report)
    setShowDeleteModal(true)
  }

  // 삭제
  async function handleDelete() {
    if (!selectedReport) return

    if (!window.confirm('정말 삭제하시겠습니까? 되돌릴 수 없습니다')) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        showError(data)
        return
      }

      showSuccess('삭제되었습니다')
      setShowDeleteModal(false)
      loadReports()
    } catch (error) {
      showError(error)
    } finally {
      setSubmitting(false)
    }
  }

  // 게시/중지 토글
  async function toggleStatus(report: ReportedIssue) {
    const newStatus = report.status === 'active' ? 'paused' : 'active'
    const action = newStatus === 'active' ? '게시 시작하시겠습니까?' : '노출 중지하시겠습니까?'

    if (!window.confirm(action)) {
      return
    }

    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      const message = newStatus === 'active' ? '게시 시작되었습니다' : '노출 중지되었습니다'
      showSuccess(message)
      loadReports()
    } catch (error) {
      showError(error)
    }
  }

  // Status 뱃지 렌더링
  function renderStatusBadge(status: string) {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    }

    const labels = {
      active: '게시중',
      paused: '중지',
      pending: '대기',
      approved: '승인됨',
      rejected: '거부됨'
    }

    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">제보 관리</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            등록하기
          </Button>
        </div>

        <Card className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600">
              로딩 중...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              등록된 제보가 없습니다
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>제보자</TableHead>
                  <TableHead>추가정보</TableHead>
                  <TableHead>궁금해요</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(report => {
                  const isFullyReached = report.curious_count >= report.threshold
                  return (
                    <TableRow
                      key={report.id}
                      className={isFullyReached ? 'bg-green-50' : ''}
                    >
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{report.reporter_name}</TableCell>
                      <TableCell>{report.description}</TableCell>
                      <TableCell>
                        {report.curious_count} / {report.threshold}
                        {isFullyReached && (
                          <span className="ml-2 text-green-600 font-semibold">100%</span>
                        )}
                      </TableCell>
                      <TableCell>{renderStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(report)}
                          disabled={report.status === 'pending'}
                        >
                          {report.status === 'active' ? '중지' : '게시'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(report)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(report)}
                          disabled={report.status === 'active'}
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

      {/* CreateModal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>제보 등록</DialogTitle>
            <DialogDescription>
              새로운 제보를 등록합니다. 등록 후 상태는 '중지'로 설정됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                제목 (2-100자)
              </label>
              <Input
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{createTitle.length}/100자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                제보자 닉네임 (2-20자)
              </label>
              <Input
                value={createReporterName}
                onChange={(e) => setCreateReporterName(e.target.value)}
                placeholder="제보자 닉네임"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">{createReporterName.length}/20자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                추가정보 (2-30자)
              </label>
              <Input
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="추가정보를 입력하세요"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">{createDescription.length}/30자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                정원 (최소 10명)
              </label>
              <Input
                type="number"
                value={createThreshold}
                onChange={(e) => setCreateThreshold(e.target.value)}
                min="10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EditModal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>제보 수정</DialogTitle>
            <DialogDescription>
              제보 정보를 수정합니다. 정원은 수정할 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                제목 (2-100자)
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">{editTitle.length}/100자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                제보자 닉네임 (2-20자)
              </label>
              <Input
                value={editReporterName}
                onChange={(e) => setEditReporterName(e.target.value)}
                placeholder="제보자 닉네임"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">{editReporterName.length}/20자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                추가정보 (2-30자)
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="추가정보를 입력하세요"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">{editDescription.length}/30자</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                정원 (수정 불가)
              </label>
              <Input
                type="number"
                value={selectedReport?.threshold || 0}
                disabled
              />
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

      {/* DeleteModal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>제보 삭제</DialogTitle>
            <DialogDescription>
              정말 삭제하시겠습니까? 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">제목:</span> {selectedReport?.title}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">제보자:</span> {selectedReport?.reporter_name}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
