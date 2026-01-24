'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'




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
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginAttempted, setLoginAttempted] = useState(false)

  // 닉네임 변경 모달
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [isNicknameSubmitting, setIsNicknameSubmitting] = useState(false)

  // 회원 탈퇴 모달 (2단계)
  const [showDeleteStep1, setShowDeleteStep1] = useState(false)
  const [showDeleteStep2, setShowDeleteStep2] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 로그아웃 중 상태 (자동 로그인 방지용)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/my/profile')
      if (response.ok) {
        const apiResponse = await response.json()
        // API는 { success: true, data: ProfileData } 형태로 응답
        if (apiResponse.success && apiResponse.data) {
          setProfileData(apiResponse.data)
        }
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

  // 닉네임 변경 핸들러
  const handleNicknameChange = async () => {
    setNicknameError('')

    // 클라이언트 검증
    if (!newNickname || newNickname.length < 2) {
      setNicknameError('닉네임은 2자 이상이어야 합니다')
      return
    }
    if (newNickname.length > 20) {
      setNicknameError('닉네임은 20자 이하여야 합니다')
      return
    }
    if (!/^[가-힣a-zA-Z0-9]{2,20}$/.test(newNickname)) {
      setNicknameError('한글, 영문, 숫자만 사용 가능합니다')
      return
    }

    setIsNicknameSubmitting(true)

    try {
      const response = await fetch('/api/auth/update-nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: newNickname })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 성공: 프로필 새로고침
        await fetchProfile()
        setShowNicknameModal(false)
        setNewNickname('')
        alert('닉네임이 변경되었습니다')
      } else {
        // 에러 메시지 표시
        setNicknameError(result.error?.message || '닉네임 변경에 실패했습니다')
      }
    } catch (error) {
      console.error('Nickname change error:', error)
      setNicknameError('네트워크 오류가 발생했습니다')
    } finally {
      setIsNicknameSubmitting(false)
    }
  }

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 성공: 클라이언트에서도 로그아웃 처리
        alert('회원 탈퇴가 완료되었습니다')
        // 페이지 새로고침으로 Auth 상태 완전 초기화
        window.location.href = '/'
      } else {
        alert(result.error?.message || '회원 탈퇴에 실패했습니다')
        setShowDeleteStep2(false)
      }
    } catch (error) {
      console.error('Delete account error:', error)
      alert('네트워크 오류가 발생했습니다')
      setShowDeleteStep2(false)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (loading || isLoggingOut) return

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
  }, [user, loading, loginAttempted, isLoggingOut])

  // 로딩 중이거나 로그인 처리 중
  if (loading || isLoading || !user) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="p-6">
        <p className="text-slate-500">프로필 정보를 불러올 수 없습니다.</p>
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">대시보드</h1>

      {/* 계정 정보 */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">계정 정보</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">닉네임</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{profileData.nickname || '알 수 없음'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewNickname(profileData.nickname || '')
                  setNicknameError('')
                  setShowNicknameModal(true)
                }}
              >
                변경
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">이메일</span>
            <span className="font-medium text-slate-900">{profileData.email || '알 수 없음'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">가입일</span>
            <span className="font-medium text-slate-900">{formattedDate}</span>
          </div>
        </div>

        {/* 로그아웃 / 회원 탈퇴 버튼 (PC: 우측 정렬) */}
        <div className="mt-6 pt-6 border-t flex justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setIsLoggingOut(true)
              await signOut()
              window.location.href = '/'
            }}
          >
            로그아웃
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:text-red-700 hover:bg-red-50 hover:border-red-400"
            onClick={() => setShowDeleteStep1(true)}
          >
            회원 탈퇴
          </Button>
        </div>
      </Card>

      {/* 활동 통계 */}
      <h2 className="text-lg font-semibold text-slate-900 mb-4">활동 통계</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => router.push('/my/votes')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🗳️</span>
            <span className="text-3xl font-bold text-yellow-600">{stats.vote_count}</span>
          </div>
          <p className="text-slate-600 text-sm">참여한 투표</p>
        </Card>

        <Card className="p-6 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => router.push('/my/comments')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💬</span>
            <span className="text-3xl font-bold text-yellow-600">{stats.comment_count}</span>
          </div>
          <p className="text-slate-600 text-sm">작성한 댓글</p>
        </Card>

        <Card className="p-6 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer" onClick={() => router.push('/my/curious')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">❓</span>
            <span className="text-3xl font-bold text-yellow-600">{stats.curious_count}</span>
          </div>
          <p className="text-slate-600 text-sm">궁금해요 누른 제보</p>
        </Card>
      </div>

      {/* 닉네임 변경 모달 */}
      <Dialog open={showNicknameModal} onOpenChange={setShowNicknameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>닉네임 변경</DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">닉네임 변경 규칙:</span>
              <span className="block">• 2~20자 (한글, 영문, 숫자)</span>
              <span className="block text-red-600 font-semibold">• 30일에 1회만 변경 가능</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nickname">새 닉네임</Label>
              <Input
                id="nickname"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="새 닉네임을 입력하세요"
                maxLength={20}
                disabled={isNicknameSubmitting}
              />
            </div>
            {nicknameError && (
              <p className="text-sm text-red-600">{nicknameError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNicknameModal(false)}
              disabled={isNicknameSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleNicknameChange}
              disabled={isNicknameSubmitting}
            >
              {isNicknameSubmitting ? '변경 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원 탈퇴 1단계: 경고 */}
      <AlertDialog open={showDeleteStep1} onOpenChange={setShowDeleteStep1}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원 탈퇴</AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-3 text-left text-sm text-muted-foreground">
            <p>정말 탈퇴하시겠습니까?</p>
            
            <div className="space-y-2">
              <p className="hidden sm:block">탈퇴 시 다음 사항을 확인해주세요:</p>
              <p className="sm:hidden font-semibold">탈퇴 시 확인사항:</p>
              
              <ul className="space-y-1 ml-4">
                <li className="hidden sm:list-item">• 계정 정보는 즉시 삭제됩니다</li>
                <li className="hidden sm:list-item">• 작성한 댓글과 투표 내역은 &quot;탈퇴한 사용자&quot;로 표시됩니다</li>
                <li className="sm:hidden">• 계정 정보 즉시 삭제</li>
                <li className="sm:hidden">• 댓글/투표는 &quot;탈퇴한 사용자&quot;로 표시</li>
                <li className="text-red-600 font-semibold">
                  • 탈퇴 후 30일 이내 고객센터 문의 시 복구 가능
                </li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setShowDeleteStep1(false)
                setShowDeleteStep2(true)
              }}
            >
              계속
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 회원 탈퇴 2단계: 최종 확인 */}
      <AlertDialog open={showDeleteStep2} onOpenChange={setShowDeleteStep2}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">최종 확인</AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-3">
            <p className="text-base font-semibold text-slate-900">
              정말로 탈퇴하시겠습니까?
            </p>
            <p className="text-sm text-muted-foreground">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? '처리 중...' : '탈퇴'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
