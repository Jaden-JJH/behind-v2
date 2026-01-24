'use client'

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { getDeviceHash } from "@/lib/device-hash"
import { curiousReport, fetchReports } from "@/lib/api-client"
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
  const hasFetchedCuriousStatus = useRef(false)

  // 클라이언트에서 마운트 후 is_curious 상태 업데이트
  useEffect(() => {
    // 이미 fetch 했으면 스킵
    if (hasFetchedCuriousStatus.current) return
    hasFetchedCuriousStatus.current = true

    const updateCuriousStatus = async () => {
      try {
        const deviceHash = getDeviceHash()
        const response = await fetchReports({
          visibility: 'active',
          device_hash: deviceHash
        })

        if (response.data) {
          // 서버에서 받은 is_curious 상태로 업데이트
          const curiousMap = new Map(response.data.map((r: any) => [r.id, r.is_curious]))
          setReportedIssues(prev => prev.map(r => ({
            ...r,
            is_curious: curiousMap.get(r.id) ?? r.is_curious
          })))
        }
      } catch (err) {
        console.error('Failed to fetch curious status:', err)
      }
    }

    updateCuriousStatus()
  }, [])

  // 로그인 시 카운트 초기화
  useEffect(() => {
    if (user) {
      resetCuriousCount()
    }
  }, [user])

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
      if (err.status === 409 || err.code === 'ALREADY_CURIOUS') {
        // 이미 누른 경우: 롤백하지 않고 is_curious만 true로 유지, count는 롤백
        setReportedIssues(prev => prev.map(r =>
          r.id === reportId
            ? { ...r, curious_count: r.curious_count - 1, is_curious: true }
            : r
        ))
        showError('이미 궁금해요를 누르셨습니다.')
      } else {
        // 다른 에러: 완전 롤백
        setReportedIssues(prev => prev.map(r =>
          r.id === reportId
            ? { ...r, curious_count: r.curious_count - 1, is_curious: false }
            : r
        ))

        if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
          showError('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.')
        } else {
          console.error('Curious error:', err)
          showError('오류가 발생했습니다.')
        }
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

      <Card className="border-slate-200 bg-white gap-2">
        <CardHeader className="pb-0">
          <CardTitle className="text-base md:text-lg font-bold text-slate-800">제보된 이슈</CardTitle>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">궁금해요 수가 목표치에 도달하면 공개됩니다</p>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="space-y-2.5">
            {displayIssues.map((r) => {
              const progress = Math.min((r.curious_count / r.threshold) * 100, 100)
              const isComplete = r.curious_count >= r.threshold

              return (
                <div
                  key={r.id}
                  className={`relative p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isComplete
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* 상태 뱃지 */}
                  {isComplete && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold mb-2 ${
                      r.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      r.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {r.approval_status === 'pending' && '🔍 검토 중'}
                      {r.approval_status === 'approved' && '✓ 등록 확정'}
                      {r.approval_status === 'rejected' && '등록 불가'}
                    </div>
                  )}

                  {/* 제목 & 시간 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-sm sm:text-base font-medium text-slate-800 leading-snug flex-1 line-clamp-2">
                      {r.title}
                    </p>
                    <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                      {formatTime(new Date(r.created_at).getTime())}
                    </span>
                  </div>

                  {/* 진행률 바 & 버튼 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete
                                ? 'bg-emerald-500'
                                : progress > 50
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-xs font-bold tabular-nums min-w-[48px] text-right ${
                        isComplete ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                        {r.curious_count}/{r.threshold}
                      </span>
                    </div>

                    {!isComplete && (
                      <button
                        onClick={() => handleCurious(r.id)}
                        disabled={curiousLoading[r.id] || r.is_curious}
                        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all ${
                          r.is_curious
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 cursor-default'
                            : 'bg-slate-100 text-black hover:bg-yellow-600 active:scale-[0.98]'
                        }`}
                      >
                        {curiousLoading[r.id] ? '...' : r.is_curious ? '궁금해요 ✓' : '궁금해요'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 mt-4">
            {reportedIssues.length > 3 && (
              <button
                onClick={() => setShowAllReported(!showAllReported)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-1"
              >
                {showAllReported ? "접기" : `${reportedIssues.length - 3}개 더보기`}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllReported ? "rotate-180" : ""}`} />
              </button>
            )}
            <button
              onClick={() => window.location.href = '/reported-issues'}
              className={`${reportedIssues.length > 3 ? 'flex-1' : 'w-full'} py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all`}
            >
              전체보기
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
