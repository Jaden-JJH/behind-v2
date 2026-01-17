'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'

interface LoginPromptProps {
  open: boolean
  onClose: () => void
  voteCount?: number
  type?: 'vote' | 'curious'
}

export function LoginPrompt({ open, onClose, voteCount = 2, type = 'vote' }: LoginPromptProps) {
  const { signInWithGoogle, signInWithKakao } = useAuth()

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
      onClose()
    } catch (error) {
      console.error('Failed to sign in with Google', error)
    }
  }

  const handleKakaoLogin = async () => {
    try {
      await signInWithKakao()
      onClose()
    } catch (error) {
      console.error('Failed to sign in with Kakao', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold text-center">
            로그인하고 더 많이 참여하세요! 🙌
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 text-center">
            지금까지 {voteCount}개 이슈에 참여하셨습니다.
            <span className="block mt-1 text-slate-700">
              로그인하시면 <strong>무제한으로 참여</strong>할 수 있습니다.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 text-center">
          <div className="space-y-2">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
              size="lg"
            >
              <Image src="/google-logo.png" alt="Google" width={20} height={20} className="w-5 h-5" />
              <span className="sm:hidden">로그인</span>
              <span className="hidden sm:inline">구글 로그인</span>
            </Button>

            <Button
              onClick={handleKakaoLogin}
              className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black flex items-center justify-center gap-2"
              size="lg"
            >
              <Image src="/kakao-logo.png" alt="Kakao" width={20} height={20} className="w-5 h-5" />
              <span className="sm:hidden">로그인</span>
              <span className="hidden sm:inline">카카오 로그인</span>
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              나중에 하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
