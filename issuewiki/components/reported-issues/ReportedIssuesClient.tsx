'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Heart } from "lucide-react"
import { fetchReports, curiousReport } from "@/lib/api-client"
import { getDeviceHash } from "@/lib/device-hash"
import { formatTime, maskReporterName } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { LoginPrompt } from "@/components/LoginPrompt"
import { showSuccess, showError } from "@/lib/toast-utils"

type SortOption = 'latest' | 'progress'
type FilterOption = 'all' | 'pending' | 'approved' | 'rejected'

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
    // ignore storage errors
  }
}

interface Report {
  id: string
  title: string
  description: string
  reporter_name: string
  curious_count: number
  threshold: number
  approval_status: string
  created_at: string
  is_curious?: boolean
}

interface ReportedIssuesClientProps {
  initialReports: Report[]
}

export function ReportedIssuesClient({ initialReports }: ReportedIssuesClientProps) {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [showMyCurious, setShowMyCurious] = useState(false)
  const [curiousLoading, setCuriousLoading] = useState<Record<string, boolean>>({})
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (user) {
      resetCuriousCount()
    }
  }, [user])

  // 필터/정렬 변경 시에만 API 호출 (초기 로드는 제외)
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }
    loadReports()
  }, [sortBy, filterBy, showMyCurious])

  const loadReports = async () => {
    try {
      setLoading(true)
      const deviceHash = getDeviceHash()

      const params: any = {
        sortBy,
        device_hash: deviceHash
      }

      if (filterBy !== 'all') {
        params.approval_status = filterBy
      }

      if (showMyCurious) {
        params.my_curious = true
      }

      const response = await fetchReports(params)
      setReports(response.data)
    } catch (err) {
      console.error('Failed to load reports:', err)
      showError('제보된 이슈를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
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

      // 1. 낙관적 업데이트 (즉시 UI 반영)
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, curious_count: r.curious_count + 1, is_curious: true }
          : r
      ))

      // 2. API 호출 (백그라운드)
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
      setReports(prev => prev.map(r =>
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

  const getBadgeStyle = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-gray-100 text-gray-800'
      default:
        return ''
    }
  }

  const getBadgeText = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'pending':
        return '검토 중'
      case 'approved':
        return '이슈 등록 확정'
      case 'rejected':
        return '이슈 등록 불가'
      default:
        return ''
    }
  }

  return (
    <>
      <LoginPrompt
        type="curious"
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        voteCount={getCuriousCount()}
      />
      <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">홈으로</span>
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-800 mb-1">제보된 이슈</h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600">궁금해요 수가 목표치에 도달하면 공개됩니다</p>
        </div>

        {/* 필터 & 정렬 */}
        <div className="mb-6 space-y-4">
          {/* 상태 필터 - 칩 스타일 */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 md:overflow-x-visible">
            <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0 pb-2 md:pb-0">
              {[
                { value: 'all', label: '전체' },
                { value: 'pending', label: '검토 중' },
                { value: 'approved', label: '등록 확정' },
                { value: 'rejected', label: '등록 불가' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterBy(opt.value as FilterOption)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                    filterBy === opt.value
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 및 내가 누른 이슈 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 정렬 옵션 */}
            <div className="flex gap-1.5">
              {[
                { value: 'latest', label: '최신순' },
                { value: 'progress', label: '달성률순' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value as SortOption)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    sortBy === opt.value
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-slate-200 mx-2 hidden sm:block" />

            {/* 내가 누른 이슈 토글 */}
            <button
              onClick={() => setShowMyCurious(!showMyCurious)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ml-auto sm:ml-0 ${
                showMyCurious
                  ? 'bg-yellow-500 text-white font-medium'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              내가 궁금해요 누른
            </button>
          </div>
        </div>

        {/* 카드 리스트 */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-base">로딩 중...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-base mb-2">
              {showMyCurious
                ? '아직 궁금해요를 누른 이슈가 없습니다.'
                : '해당 조건의 이슈가 없습니다.'}
            </p>
            {showMyCurious && (
              <button
                onClick={() => setShowMyCurious(false)}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-full text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                전체 제보 보기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const progress = Math.min((report.curious_count / report.threshold) * 100, 100)
              const isComplete = report.curious_count >= report.threshold

              return (
                <div
                  key={report.id}
                  className={`bg-white rounded-xl p-4 border transition-colors ${
                    report.is_curious ? 'border-yellow-400 border-2' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* 제보자 & 배지 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-xs text-slate-500">
                      제보자: {maskReporterName(report.reporter_name)}
                    </p>
                    {isComplete && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeStyle(report.approval_status)}`}>
                        {getBadgeText(report.approval_status)}
                      </span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2">
                    {report.title}
                  </h3>

                  {/* 추가정보 */}
                  <p className="text-sm text-slate-500 mb-3 line-clamp-1">
                    {report.description}
                  </p>

                  {/* 프로그레스 바 */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{formatTime(new Date(report.created_at).getTime())}</span>
                      <span className="text-yellow-700 font-semibold">
                        {report.curious_count}/{report.threshold}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 궁금해요 버튼 */}
                  <button
                    onClick={() => handleCurious(report.id)}
                    disabled={curiousLoading[report.id] || report.curious_count >= report.threshold}
                    className={`w-full flex items-center justify-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      report.curious_count >= report.threshold
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400'
                        : report.is_curious
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'border border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${report.is_curious ? 'fill-current' : ''}`} />
                    {curiousLoading[report.id] ? '...' :
                      report.curious_count >= report.threshold ? '마감' :
                        report.is_curious ? '궁금해요 ✓' : '궁금해요'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
      </div>
    </>
  )
}
