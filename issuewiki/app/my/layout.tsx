'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function MyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {/* 대시보드 */}
          <Link
            href="/my"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/my')
                ? 'bg-yellow-50 text-slate-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">🏠</span>
            <span>대시보드</span>
          </Link>

          {/* 참여한 투표 */}
          <Link
            href="/my/votes"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/my/votes')
                ? 'bg-yellow-50 text-slate-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">🗳️</span>
            <span>참여한 투표</span>
          </Link>

          {/* 내가 쓴 댓글 */}
          <Link
            href="/my/comments"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/my/comments')
                ? 'bg-yellow-50 text-slate-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">💬</span>
            <span>내가 쓴 댓글</span>
          </Link>

          {/* 팔로우한 이슈 */}
          <Link
            href="/my/follows"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/my/follows')
                ? 'bg-yellow-50 text-slate-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">⭐</span>
            <span>팔로우한 이슈</span>
          </Link>

          {/* 참여한 채팅방 */}
          <Link
            href="/my/chat-rooms"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/my/chat-rooms')
                ? 'bg-yellow-50 text-slate-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">💬</span>
            <span>참여한 채팅방</span>
          </Link>

          {/* 궁금해요 누른 제보 */}
          <Link
            href="/my/curious"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive('/my/curious')
                ? 'bg-yellow-50 text-slate-900 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3">❓</span>
            <span>궁금해요 누른 제보</span>
          </Link>
        </nav>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 p-4 z-40 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">마이페이지</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-700 p-2"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-30 pt-32">
          <nav className="p-4 space-y-1">
            {/* 대시보드 */}
            <Link
              href="/my"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/my')
                  ? 'bg-yellow-50 text-slate-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">🏠</span>
              <span>대시보드</span>
            </Link>

            {/* 참여한 투표 */}
            <Link
              href="/my/votes"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/my/votes')
                  ? 'bg-yellow-50 text-slate-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">🗳️</span>
              <span>참여한 투표</span>
            </Link>

            {/* 내가 쓴 댓글 */}
            <Link
              href="/my/comments"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/my/comments')
                  ? 'bg-yellow-50 text-slate-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">💬</span>
              <span>내가 쓴 댓글</span>
            </Link>

            {/* 팔로우한 이슈 */}
            <Link
              href="/my/follows"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/my/follows')
                  ? 'bg-yellow-50 text-slate-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">⭐</span>
              <span>팔로우한 이슈</span>
            </Link>

            {/* 참여한 채팅방 */}
            <Link
              href="/my/chat-rooms"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/my/chat-rooms')
                  ? 'bg-yellow-50 text-slate-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">💬</span>
              <span>참여한 채팅방</span>
            </Link>

            {/* 궁금해요 누른 제보 */}
            <Link
              href="/my/curious"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive('/my/curious')
                  ? 'bg-yellow-50 text-slate-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3">❓</span>
              <span>궁금해요 누른 제보</span>
            </Link>
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
