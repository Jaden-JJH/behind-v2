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
}

export function LoginPrompt({ open, onClose, onLogin, voteCount = 2 }: LoginPromptProps) {
  const handleLogin = () => {
    onLogin()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            로그인하고 더 많이 투표하세요! 🗳️
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            지금까지 {voteCount}개 이슈에 투표하셨습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-700">
            로그인하시면 <strong>무제한으로 투표</strong>할 수 있습니다.
          </p>
          
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
