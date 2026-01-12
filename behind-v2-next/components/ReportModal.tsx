'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { showSuccess, showError } from '@/lib/toast-utils'
import { csrfFetch } from '@/lib/csrf-client'
import { AlertTriangle } from 'lucide-react'

const REPORT_REASONS = [
  '욕설/비방/혐오 표현',
  '허위사실 유포',
  '명예훼손/모욕',
  '개인정보 노출',
  '음란물/불건전 콘텐츠',
  '광고/스팸',
  '기타'
] as const

type ReportReason = typeof REPORT_REASONS[number]

interface ReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: 'issue' | 'poll' | 'comment'
  contentId: string
  onReportSuccess?: () => void
}

export function ReportModal({
  open,
  onOpenChange,
  contentType,
  contentId,
  onReportSuccess
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | ''>('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const contentTypeKo = {
    issue: '이슈',
    poll: '투표',
    comment: '댓글'
  }[contentType]

  const handleSubmit = async () => {
    if (!selectedReason) {
      showError('신고 사유를 선택해주세요')
      return
    }

    if (selectedReason === '기타' && !reasonDetail.trim()) {
      showError('기타를 선택하신 경우 상세 사유를 입력해주세요')
      return
    }

    if (reasonDetail.length > 200) {
      showError('상세 사유는 최대 200자까지 입력 가능합니다')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await csrfFetch('/api/content-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType,
          contentId,
          reason: selectedReason,
          reasonDetail: reasonDetail.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.message) {
          showError(data.error.message)
        } else {
          showError('신고 접수 중 오류가 발생했습니다')
        }
        return
      }

      showSuccess('신고가 접수되었습니다. 검토 후 24시간 내 조치됩니다')

      // 상태 초기화
      setSelectedReason('')
      setReasonDetail('')
      onOpenChange(false)
      onReportSuccess?.()

    } catch (error) {
      console.error('Report submission error:', error)
      showError('신고 접수 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedReason('')
    setReasonDetail('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => {
          // 작성 중이면 닫기 방지
          if (selectedReason || reasonDetail) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>신고하기</DialogTitle>
          <DialogDescription>
            신고 사유를 선택해주세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>신고 대상: {contentTypeKo}</Label>

            <RadioGroup value={selectedReason} onValueChange={(value) => setSelectedReason(value as ReportReason)} className="space-y-3">
              {REPORT_REASONS.map((reason) => (
                <div
                  key={reason}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReason(reason as ReportReason)}
                >
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="font-normal cursor-pointer flex-1">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === '기타' && (
            <div className="space-y-2">
              <Label htmlFor="reasonDetail">
                상세 사유 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reasonDetail"
                placeholder="상세 사유를 입력해주세요 (최대 200자)"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                maxLength={200}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reasonDetail.length}/200
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              허위 신고 시 서비스 이용이 제한될 수 있습니다
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? '접수 중...' : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
