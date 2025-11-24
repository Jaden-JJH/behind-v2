'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProfileData {
  email: string
  nickname: string
  created_at: string
  stats: {
    vote_count: number
    comment_count: number
    curious_count: number
  }
}

export default function MyPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginAttempted, setLoginAttempted] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/my/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      } else if (response.status === 401) {
        // 401 에러: 세션이 만료되었거나 없음
        // 사용자가 직접 로그인했다면 이는 세션 설정 문제이므로
        // 자동 리다이렉트 대신 에러 상태 표시
        console.error('Session error - user might need to refresh or re-login')
        setProfileData(null)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
      // 로그인 성공 → 프로필 데이터 조회
      fetchProfile()
    }
  }, [user, loading, loginAttempted, signInWithGoogle, router, fetchProfile])

  // 로딩 중이거나 로그인 처리 중
  if (loading || isLoading || !user) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="p-6">
        <p className="text-gray-500">프로필 정보를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const joinDate = new Date(profileData.created_at)
  const formattedDate = `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월`

  // 안전한 stats 접근
  const stats = profileData.stats || {
    vote_count: 0,
    comment_count: 0,
    curious_count: 0
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>

      {/* 계정 정보 */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">계정 정보</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">닉네임</span>
            <span className="font-medium text-gray-900">{profileData.nickname || '알 수 없음'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">이메일</span>
            <span className="font-medium text-gray-900">{profileData.email || '알 수 없음'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">가입일</span>
            <span className="font-medium text-gray-900">{formattedDate}</span>
          </div>
        </div>
      </Card>

      {/* 활동 통계 */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">활동 통계</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/my/votes')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🗳️</span>
            <span className="text-3xl font-bold text-indigo-600">{stats.vote_count}</span>
          </div>
          <p className="text-gray-600 text-sm">참여한 투표</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/my/comments')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💬</span>
            <span className="text-3xl font-bold text-indigo-600">{stats.comment_count}</span>
          </div>
          <p className="text-gray-600 text-sm">작성한 댓글</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/my/curious')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">❓</span>
            <span className="text-3xl font-bold text-indigo-600">{stats.curious_count}</span>
          </div>
          <p className="text-gray-600 text-sm">궁금해요 누른 제보</p>
        </Card>
      </div>
    </div>
  )
}
