'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminReportsPage() {
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
        <h1 className="text-3xl font-bold mb-6">제보 관리</h1>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 text-center py-12">
            제보 관리 기능은 추후 개발 예정입니다.
          </p>
        </div>
      </div>
    </div>
  )
}
