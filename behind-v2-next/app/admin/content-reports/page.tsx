'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

// 타입 정의
interface Report {
  id: string
  content_type: 'issue' | 'poll' | 'comment'
  content_id: string
  reporter_id: string | null
  reporter_nick: string
  reporter_ip: string | null
  reason: string
  reason_detail: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  review_note: string | null
  created_at: string
  // JOIN 결과
  content_title?: string
  content_body?: string
  content_preview?: string
}

// 상수 정의
const STATUS_LABELS = {
  pending: '대기',
  approved: '승인',
  rejected: '거부'
} as const

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800'
} as const

const CONTENT_TYPE_LABELS = {
  issue: '이슈',
  poll: '투표',
  comment: '댓글'
} as const

const CONTENT_TYPE_COLORS = {
  issue: 'bg-blue-100 text-blue-800',
  poll: 'bg-purple-100 text-purple-800',
  comment: 'bg-indigo-100 text-indigo-800'
} as const

const ITEMS_PER_PAGE = 20

export default function AdminContentReportsPage() {
  const router = useRouter()

  // 목록 상태
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // 필터
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterContentType, setFilterContentType] = useState<string>('')

  // 모달
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  // 리뷰 폼
  const [reviewNote, setReviewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus, filterContentType])

  async function loadReports() {
    try {
      setLoading(true)

      const offset = (currentPage - 1) * ITEMS_PER_PAGE
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(ITEMS_PER_PAGE),
        status: filterStatus || 'all'
      })

      if (filterContentType) params.append('contentType', filterContentType)

      const response = await fetch(`/api/admin/reports?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      setReports(data.data?.reports || [])
      setTotalCount(data.data?.total || 0)
      setTotalPages(Math.ceil((data.data?.total || 0) / ITEMS_PER_PAGE))
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  // 필터 핸들러
  function handleStatusChange(value: string) {
    setFilterStatus(value === 'all' ? '' : value)
    setCurrentPage(1)
  }

  function handleContentTypeChange(value: string) {
    setFilterContentType(value === 'all' ? '' : value)
    setCurrentPage(1)
  }

  function handleResetFilters() {
    setFilterStatus('')
    setFilterContentType('')
    setCurrentPage(1)
  }

  // 상세 모달 열기
  function openDetailModal(report: Report) {
    setSelectedReport(report)
    setReviewNote(report.review_note || '')
    setDetailModalOpen(true)
  }

  // 신고 검토 (승인/거부)
  async function handleReview(action: 'approve' | 'reject') {
    if (!selectedReport) return

    // pending 상태만 처리 가능
    if (selectedReport.status !== 'pending') {
      showError('이미 처리된 신고입니다')
      return
    }

    try {
      setSubmitting(true)

      const response = await csrfFetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          action,
          reviewNote: reviewNote.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data)
        return
      }

      showSuccess(action === 'approve'
        ? '신고가 승인되었습니다 (콘텐츠 블라인드 처리됨)'
        : '신고가 거부되었습니다'
      )

      setDetailModalOpen(false)
      loadReports()
    } catch (error) {
      showError(error)
    } finally {
      setSubmitting(false)
    }
  }

  // 렌더링 헬퍼
  function renderStatusBadge(status: Report['status']) {
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[status]}`}>
        {STATUS_LABELS[status]}
      </span>
    )
  }

  function renderContentTypeBadge(contentType: Report['content_type']) {
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${CONTENT_TYPE_COLORS[contentType]}`}>
        {CONTENT_TYPE_LABELS[contentType]}
      </span>
    )
  }

  function getContentText(report: Report): string {
    const info = (report as any).content_info
    if (!info) return '(내용 없음)'

    if (report.content_type === 'comment') {
      return info.body || '(내용 없음)'
    }
    if (report.content_type === 'issue') {
      return info.title || info.description || '(제목 없음)'
    }
    if (report.content_type === 'poll') {
      return info.question || '(질문 없음)'
    }
    return '(내용 없음)'
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function truncateText(text: string, maxLength: number = 50): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">콘텐츠 신고 관리</h1>
        </div>

        {/* 필터 영역 */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">상태</label>
              <Select value={filterStatus || 'all'} onValueChange={handleStatusChange}>
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
              <label className="block text-sm font-medium mb-1">콘텐츠 유형</label>
              <Select value={filterContentType || 'all'} onValueChange={handleContentTypeChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="issue">이슈</SelectItem>
                  <SelectItem value="poll">투표</SelectItem>
                  <SelectItem value="comment">댓글</SelectItem>
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

        {/* 통계 카드 */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 신고</p>
              <p className="text-2xl font-bold">{totalCount.toLocaleString()}건</p>
            </div>
            <div className="text-sm text-gray-600">
              페이지 {currentPage} / {totalPages}
            </div>
          </div>
        </Card>

        {/* 테이블 */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-600">
              로딩 중...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              신고 내역이 없습니다
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">신고 ID</TableHead>
                      <TableHead className="w-24">유형</TableHead>
                      <TableHead>콘텐츠</TableHead>
                      <TableHead className="w-28">신고자</TableHead>
                      <TableHead>신고 사유</TableHead>
                      <TableHead className="w-20">상태</TableHead>
                      <TableHead className="w-40">신고일시</TableHead>
                      <TableHead className="w-24 text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono text-xs">
                          {report.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {renderContentTypeBadge(report.content_type)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {truncateText(getContentText(report))}
                          </div>
                        </TableCell>
                        <TableCell>{report.reporter_nick}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {truncateText(report.reason)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(report.status)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(report.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(report)}
                          >
                            상세보기
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* 상세 모달 */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신고 상세</DialogTitle>
            <DialogDescription>
              신고된 콘텐츠 정보와 신고 사유를 확인하고 검토할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* 신고 기본 정보 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-3">신고 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-24 text-gray-600">신고 ID:</span>
                    <span className="font-mono">{selectedReport.id}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-600">신고일시:</span>
                    <span>{formatDate(selectedReport.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-24 text-gray-600">상태:</span>
                    {renderStatusBadge(selectedReport.status)}
                  </div>
                </div>
              </div>

              {/* 신고된 콘텐츠 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-3">신고된 콘텐츠</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-24 text-gray-600">유형:</span>
                    {renderContentTypeBadge(selectedReport.content_type)}
                  </div>
                  <div>
                    <span className="text-gray-600">내용:</span>
                    <div className="mt-1 p-3 bg-gray-50 rounded border">
                      {getContentText(selectedReport)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 신고자 정보 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-3">신고자 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-24 text-gray-600">닉네임:</span>
                    <span>{selectedReport.reporter_nick}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-gray-600">IP 주소:</span>
                    <span className="font-mono">{selectedReport.reporter_ip || '(정보 없음)'}</span>
                  </div>
                </div>
              </div>

              {/* 신고 사유 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-3">신고 사유</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-24 text-gray-600">사유:</span>
                    <span className="font-medium">{selectedReport.reason}</span>
                  </div>
                  {selectedReport.reason_detail && (
                    <div>
                      <span className="text-gray-600">상세 설명:</span>
                      <div className="mt-1 p-3 bg-gray-50 rounded border">
                        {selectedReport.reason_detail}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 관리자 검토 (pending일 때만) */}
              {selectedReport.status === 'pending' && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">관리자 검토</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      검토 메모 (선택사항)
                    </label>
                    <Textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="검토 사항을 기록하세요..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{reviewNote.length}/500자</p>
                  </div>
                </div>
              )}

              {/* 검토 완료 정보 (approved/rejected일 때) */}
              {selectedReport.status !== 'pending' && (
                <div className="bg-gray-50 rounded p-4">
                  <h3 className="text-sm font-semibold mb-3">검토 완료 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-24 text-gray-600">검토일시:</span>
                      <span>{selectedReport.reviewed_at ? formatDate(selectedReport.reviewed_at) : '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-gray-600">검토자:</span>
                      <span>{selectedReport.reviewed_by || '-'}</span>
                    </div>
                    {selectedReport.review_note && (
                      <div>
                        <span className="text-gray-600">검토 메모:</span>
                        <div className="mt-1 p-3 bg-white rounded border">
                          {selectedReport.review_note}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedReport?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDetailModalOpen(false)}
                  disabled={submitting}
                >
                  취소
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReview('reject')}
                  disabled={submitting}
                >
                  거부
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleReview('approve')}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitting ? '처리 중...' : '승인 (블라인드 처리)'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDetailModalOpen(false)}
              >
                닫기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
