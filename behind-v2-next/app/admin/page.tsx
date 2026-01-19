'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { csrfFetch } from '@/lib/csrf-client'

export default function AdminDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // 인증 확인
    fetch('/api/admin/check')
      .then(res => {
        if (!res.ok) router.push('/admin/login')
      })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">이슈위키 어드민 대시보드</h1>

        {/* 통계 카드 (추후 개발 예정) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium mb-2">전체 이슈</h3>
            <p className="text-3xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-400 mt-2">추후 구현 예정</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium mb-2">활성 채팅방</h3>
            <p className="text-3xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-400 mt-2">추후 구현 예정</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-500 text-sm font-medium mb-2">대기중인 제보</h3>
            <p className="text-3xl font-bold text-gray-900">-</p>
            <p className="text-xs text-gray-400 mt-2">추후 구현 예정</p>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">빠른 액션</h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/admin/issues/new"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <span className="mr-2">➕</span>
              <span>이슈 등록하러 가기</span>
            </Link>

            <Link
              href="/admin/issues"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">📋</span>
              <span>이슈 목록 관리</span>
            </Link>

            <Link
              href="/admin/reports"
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">📢</span>
              <span>제보 관리</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
