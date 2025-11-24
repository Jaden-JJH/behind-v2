'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function MyCuriousPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [loginAttempted, setLoginAttempted] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user && !loginAttempted) {
      // 첫 시도: 비로그인 시 로그인 시도
      setLoginAttempted(true)
      signInWithGoogle()
      return
    }

    if (!user && loginAttempted) {
      // 로그인 실패 또는 취소 → 홈으로 리다이렉트
      router.push('/')
      return
    }

    if (user) {
      // 로그인 성공 → 기존 제보 페이지로 리다이렉트 (my_curious 필터 활성화)
      router.push('/reported-issues?my_curious=true')
    }
  }, [user, loading, loginAttempted, signInWithGoogle, router])

  return (
    <div className="p-6 text-center">
      <p className="text-gray-500">리다이렉트 중...</p>
    </div>
  )
}
