'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LoginPromptProps {
  open: boolean
  onClose: () => void
  onLogin: () => void
  voteCount?: number
  type?: 'vote' | 'curious'
}

export function LoginPrompt({ open, onClose, onLogin, voteCount = 2, type = 'vote' }: LoginPromptProps) {
  const handleLogin = () => {
    onLogin()
    onClose()
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
              onClick={handleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              size="lg"
            >
              구글로 계속하기
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
