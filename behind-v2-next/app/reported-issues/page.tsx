'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Heart, ChevronDown } from "lucide-react"
import { fetchReports, curiousReport } from "@/lib/api-client"
import { getDeviceHash } from "@/lib/device-hash"
import { formatTime, maskReporterName } from "@/lib/utils"

type SortOption = 'latest' | 'progress'
type FilterOption = 'all' | 'pending' | 'approved' | 'rejected'

export default function ReportedIssuesPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [showMyCurious, setShowMyCurious] = useState(false)
  const [curiousLoading, setCuriousLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
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

      console.log('API 요청 파라미터:', params)
      const response = await fetchReports(params)
      console.log('API 응답:', response)
      setReports(response.data)
    } catch (err) {
      console.error('Failed to load reports:', err)
      alert('제보된 이슈를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCurious = async (reportId: string) => {
    setCuriousLoading(prev => ({ ...prev, [reportId]: true }))

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

      // 3. alert 메시지 간결하게
      alert('궁금해요를 눌렀습니다!')

      // loadReports() 제거됨 - 이미 UI 업데이트 완료

    } catch (err: any) {
      // 에러 시 롤백
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, curious_count: r.curious_count - 1, is_curious: false }
          : r
      ))

      if (err.status === 409 || err.code === 'ALREADY_CURIOUS') {
        alert('이미 궁금해요를 누르셨습니다.')
      } else if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
        alert('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.')
      } else {
        console.error('Curious error:', err)
        alert('오류가 발생했습니다.')
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <h1 className="text-3xl font-bold tracking-tight text-slate-700 cursor-pointer">비하인드</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/issues">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">전체 이슈</Button>
              </Link>
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">내 대화방</Button>
              <Button 
                variant="ghost" 
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => window.open('https://forms.gle/xot7tw9vZ48uhChG7', '_blank', 'noopener,noreferrer')}
              >
                제보하기
              </Button>
            </nav>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">로그인</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 md:px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/issues">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <ChevronLeft className="w-4 h-4 mr-1" />
                전체 이슈
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">제보된 이슈</h1>
          <p className="text-slate-600">궁금해요 수가 목표치에 도달하면 공개됩니다</p>
        </div>

        {/* 필터 & 정렬 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {/* 상태 필터 */}
            <div className="relative">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="px-4 py-2 pr-10 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="all">전체</option>
                <option value="pending">검토 중</option>
                <option value="approved">등록 확정</option>
                <option value="rejected">등록 불가</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* 내가 누른 이슈 토글 */}
            <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showMyCurious}
                onChange={(e) => setShowMyCurious(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              내가 궁금해요 누른 이슈만
            </label>
          </div>

          {/* 정렬 */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 pr-10 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="latest">최신순</option>
              <option value="progress">달성률순</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* 카드 리스트 */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">로딩 중...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-2">
              {showMyCurious 
                ? '아직 궁금해요를 누른 이슈가 없습니다.' 
                : '해당 조건의 이슈가 없습니다.'}
            </p>
            {showMyCurious && (
              <Button 
                variant="outline"
                onClick={() => setShowMyCurious(false)}
                className="mt-4"
              >
                전체 제보 보기
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const progress = Math.min((report.curious_count / report.threshold) * 100, 100)
              const isComplete = report.curious_count >= report.threshold

              return (
                <Card 
                  key={report.id}
                  className={`hover:shadow-lg transition-all ${
                    report.is_curious ? 'border-indigo-400 border-2' : 'border-slate-200'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* 제보자 & 배지 */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-xs text-slate-500">
                        제보자: {maskReporterName(report.reporter_name)}
                      </p>
                      {isComplete && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getBadgeStyle(report.approval_status)}`}>
                          {getBadgeText(report.approval_status)}
                        </span>
                      )}
                    </div>

                    {/* 제목 */}
                    <h3 className="text-base font-semibold text-slate-800 mb-2 line-clamp-2">
                      {report.title}
                    </h3>

                    {/* 추가정보 */}
                    <p className="text-sm text-slate-600 mb-3 line-clamp-1">
                      {report.description}
                    </p>

                    {/* 프로그레스 바 */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{formatTime(new Date(report.created_at).getTime())}</span>
                        <span className="text-indigo-700 font-semibold">
                          {report.curious_count}/{report.threshold}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* 궁금해요 버튼 */}
                    <Button
                      variant={report.is_curious ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCurious(report.id)}
                      disabled={curiousLoading[report.id]}
                      className={`w-full ${
                        report.is_curious 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                          : 'border-indigo-400 text-indigo-700 hover:bg-indigo-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${report.is_curious ? 'fill-current' : ''}`} />
                      {curiousLoading[report.id] ? '...' : report.is_curious ? '궁금해요 ✓' : '궁금해요'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-slate-500 border-t border-slate-200 bg-white mt-8">
        Copyright © 2025 by Behind
      </footer>
    </div>
  )
}
