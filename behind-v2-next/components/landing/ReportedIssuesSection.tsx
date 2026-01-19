'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { getDeviceHash } from "@/lib/device-hash"
import { curiousReport } from "@/lib/api-client"
import { useAuth } from "@/hooks/useAuth"
import { LoginPrompt } from "@/components/LoginPrompt"
import { showSuccess, showError } from "@/lib/toast-utils"

interface ReportedIssue {
  id: string
  title: string
  created_at: string
  curious_count: number
  threshold: number
  is_curious: boolean
  approval_status: string
}

interface ReportedIssuesSectionProps {
  initialIssues: ReportedIssue[]
}

const CURIOUS_COUNT_KEY = "bh_curious_count"

const getCuriousCount = (): number => {
  if (typeof window === "undefined") return 0
  try {
    const count = window.localStorage.getItem(CURIOUS_COUNT_KEY)
    return count ? Number.parseInt(count, 10) : 0
  } catch {
    return 0
  }
}

const incrementCuriousCount = (): number => {
  if (typeof window === "undefined") return 0
  try {
    const current = getCuriousCount()
    const newCount = current + 1
    window.localStorage.setItem(CURIOUS_COUNT_KEY, String(newCount))
    return newCount
  } catch {
    return 0
  }
}

const resetCuriousCount = (): void => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(CURIOUS_COUNT_KEY)
  } catch {
    // ignore
  }
}

export function ReportedIssuesSection({ initialIssues }: ReportedIssuesSectionProps) {
  const { user } = useAuth()
  const [showAllReported, setShowAllReported] = useState(false)
  const [reportedIssues, setReportedIssues] = useState(initialIssues)
  const [curiousLoading, setCuriousLoading] = useState<Record<string, boolean>>({})
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // 로그인 시 카운트 초기화
  if (user && typeof window !== 'undefined') {
    resetCuriousCount()
  }

  const handleCurious = async (reportId: string) => {
    setCuriousLoading(prev => ({ ...prev, [reportId]: true }))

    if (!user) {
      const currentCount = getCuriousCount()
      if (currentCount >= 2) {
        setShowLoginPrompt(true)
      }
    }

    try {
      const deviceHash = getDeviceHash()

      // 낙관적 업데이트
      setReportedIssues(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, curious_count: r.curious_count + 1, is_curious: true }
          : r
      ))

      // API 호출
      await curiousReport(reportId, deviceHash)

      showSuccess('궁금해요를 눌렀습니다!')

      if (!user) {
        const currentCount = getCuriousCount()
        if (currentCount < 3) {
          incrementCuriousCount()
        }
      }

    } catch (err: any) {
      // 에러 시 롤백
      setReportedIssues(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, curious_count: r.curious_count - 1, is_curious: false }
          : r
      ))

      if (err.status === 409 || err.code === 'ALREADY_CURIOUS') {
        showError('이미 궁금해요를 누르셨습니다.')
      } else if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
        showError('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.')
      } else {
        console.error('Curious error:', err)
        showError('오류가 발생했습니다.')
      }
    } finally {
      setCuriousLoading(prev => ({ ...prev, [reportId]: false }))
    }
  }

  // 서버에서 이미 랜덤하게 섞인 데이터를 받음 (셔플 제거)
  const displayIssues = reportedIssues.slice(0, showAllReported ? reportedIssues.length : 3)

  return (
    <>
      <LoginPrompt
        type="curious"
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        voteCount={getCuriousCount()}
      />

      <Card className="border-slate-200 bg-slate-50/50 shadow-sm">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-base md:text-lg font-semibold text-slate-800 mb-1">제보된 이슈</CardTitle>
          <p className="text-xs sm:text-sm text-slate-600">궁금해요 수가 목표치에 도달하면 공개됩니다</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-2.5">
            {displayIssues.map((r) => {
              const progress = Math.min((r.curious_count / r.threshold) * 100, 100)

              return (
                <div
                  key={r.id}
                  className="p-3.5 sm:p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {r.curious_count >= r.threshold && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                            r.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            r.approval_status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {r.approval_status === 'pending' && '검토 중'}
                            {r.approval_status === 'approved' && '등록 확정'}
                            {r.approval_status === 'rejected' && '등록 불가'}
                          </span>
                        )}
                        <p className="text-sm sm:text-base font-medium text-slate-900 group-hover:text-slate-700 transition-colors leading-snug flex-1">
                          {r.title}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{formatTime(new Date(r.created_at).getTime())}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm text-yellow-700 font-bold">{r.curious_count}/{r.threshold}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCurious(r.id)}
                          disabled={curiousLoading[r.id] || r.curious_count >= r.threshold}
                          className={`h-8 px-3 text-xs font-semibold flex-shrink-0 ${
                            r.curious_count >= r.threshold
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 text-gray-500'
                              : r.is_curious
                              ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                              : 'border-yellow-400 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-500'
                          }`}
                        >
                          {curiousLoading[r.id] ? '...' :
                           r.curious_count >= r.threshold ? '마감' :
                           r.is_curious ? '궁금해요 ✓' : '궁금해요'}
                        </Button>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 mt-3 sm:mt-4">
            {reportedIssues.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-slate-700 hover:text-slate-800 hover:bg-slate-100 min-h-[44px] text-xs sm:text-sm"
                onClick={() => setShowAllReported(!showAllReported)}
              >
                {showAllReported ? "접기" : `${reportedIssues.length - 3}개 더보기`}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAllReported ? "rotate-180" : ""}`} />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/reported-issues'}
              className={`${reportedIssues.length > 3 ? 'flex-1' : 'w-full'} border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 min-h-[44px] text-xs sm:text-sm`}
            >
              전체보기
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
