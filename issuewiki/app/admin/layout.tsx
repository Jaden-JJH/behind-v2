'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { csrfFetch } from '@/lib/csrf-client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const [contentReportsPendingCount, setContentReportsPendingCount] = useState(0)
  const [isIssuesOpen, setIsIssuesOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fetch pending reports count
  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/admin/reports/pending-count')
      if (response.ok) {
        const data = await response.json()
        setPendingCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
    }
  }

  // Fetch content reports pending count
  const fetchContentReportsPendingCount = async () => {
    try {
      const response = await fetch('/api/admin/content-reports/pending-count')
      if (response.ok) {
        const data = await response.json()
        setContentReportsPendingCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch content reports pending count:', error)
    }
  }

  // Initial fetch and auto-refresh every 5 minutes
  useEffect(() => {
    fetchPendingCount()
    fetchContentReportsPendingCount()
    const interval = setInterval(() => {
      fetchPendingCount()
      fetchContentReportsPendingCount()
    }, 5 * 60 * 1000) // 5분
    return () => clearInterval(interval)
  }, [])

  // Auto-expand issues menu if current path is under /admin/issues
  useEffect(() => {
    if (pathname?.startsWith('/admin/issues')) {
      setIsIssuesOpen(true)
    }
  }, [pathname])

  const handleLogout = async () => {
    try {
      await csrfFetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/admin/login')
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-gray-800 text-white">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">이슈위키 어드민</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* 대시보드 */}
          <Link
            href="/admin"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin')
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="mr-3">🏠</span>
            <span>대시보드</span>
          </Link>

          {/* 이슈 관리 (접을 수 있는 그룹) */}
          <div>
            <button
              onClick={() => setIsIssuesOpen(!isIssuesOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <span className="mr-3">📝</span>
                <span>이슈 관리</span>
              </div>
              <span className="text-xs">{isIssuesOpen ? '▼' : '▶'}</span>
            </button>

            {/* 하위 메뉴 */}
            {isIssuesOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <Link
                  href="/admin/issues"
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive('/admin/issues')
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">📋</span>
                  <span>목록</span>
                </Link>
                <Link
                  href="/admin/issues/new"
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive('/admin/issues/new')
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">➕</span>
                  <span>등록</span>
                </Link>
              </div>
            )}
          </div>

          {/* 제보 관리 */}
          <Link
            href="/admin/reports"
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/reports')
                ? 'bg-indigo-600 text-white'
                : pendingCount > 0
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-3">📢</span>
              <span>제보 관리</span>
            </div>
            {pendingCount > 0 && (
              <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>

          {/* 콘텐츠 신고 관리 */}
          <Link
            href="/admin/content-reports"
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/content-reports')
                ? 'bg-indigo-600 text-white'
                : contentReportsPendingCount > 0
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-3">🚨</span>
              <span>콘텐츠 신고</span>
            </div>
            {contentReportsPendingCount > 0 && (
              <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                {contentReportsPendingCount}
              </span>
            )}
          </Link>

          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <span className="mr-3">🚪</span>
            <span>로그아웃</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-800 text-white p-4 z-50 flex items-center justify-between">
        <h1 className="text-lg font-bold">이슈위키 어드민</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-800 text-white z-40 pt-16">
          <nav className="p-4 space-y-2">
            {/* 대시보드 */}
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin')
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">🏠</span>
              <span>대시보드</span>
            </Link>

            {/* 이슈 관리 */}
            <div>
              <button
                onClick={() => setIsIssuesOpen(!isIssuesOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <span className="mr-3">📝</span>
                  <span>이슈 관리</span>
                </div>
                <span className="text-xs">{isIssuesOpen ? '▼' : '▶'}</span>
              </button>

              {isIssuesOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    href="/admin/issues"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isActive('/admin/issues')
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3">📋</span>
                    <span>목록</span>
                  </Link>
                  <Link
                    href="/admin/issues/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isActive('/admin/issues/new')
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3">➕</span>
                    <span>등록</span>
                  </Link>
                </div>
              )}
            </div>

            {/* 제보 관리 */}
            <Link
              href="/admin/reports"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin/reports')
                  ? 'bg-indigo-600 text-white'
                  : pendingCount > 0
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3">📢</span>
                <span>제보 관리</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>

            {/* 콘텐츠 신고 관리 */}
            <Link
              href="/admin/content-reports"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive('/admin/content-reports')
                  ? 'bg-indigo-600 text-white'
                  : contentReportsPendingCount > 0
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-3">🚨</span>
                <span>콘텐츠 신고</span>
              </div>
              {contentReportsPendingCount > 0 && (
                <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                  {contentReportsPendingCount}
                </span>
              )}
            </Link>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <span className="mr-3">🚪</span>
              <span>로그아웃</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}
