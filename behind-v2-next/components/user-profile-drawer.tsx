'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { MessageSquare, Vote, ExternalLink } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface RecentComment {
  id: string
  body: string
  created_at: string
  issue_id: string
  issues: {
    id: string
    display_id: number
    title: string
  }
}

interface UserProfile {
  nickname: string
  joined_at: string
  stats: {
    comment_count: number
    vote_count: number
  }
  recent_comments: RecentComment[]
}

interface UserProfileDrawerProps {
  nickname: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserProfileDrawer({ nickname, open, onOpenChange }: UserProfileDrawerProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function fetchProfile() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/users/${encodeURIComponent(nickname)}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('사용자를 찾을 수 없습니다')
          } else {
            setError('프로필을 불러올 수 없습니다')
          }
          return
        }

        const data = await response.json()
        if (data.success) {
          setProfile(data.data)
        } else {
          setError('프로필을 불러올 수 없습니다')
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
        setError('프로필을 불러오는 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [open, nickname])

  const handleViewFullProfile = () => {
    onOpenChange(false)
    router.push(`/users/${encodeURIComponent(nickname)}`)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{nickname}</DrawerTitle>
          {profile && (
            <DrawerDescription>{profile.joined_at} 가입</DrawerDescription>
          )}
        </DrawerHeader>

        <div className="px-4 pb-4">
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-muted-foreground">
              {error}
            </div>
          )}

          {profile && (
            <div className="space-y-4">
              {/* 활동 통계 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>댓글 {profile.stats.comment_count}개</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Vote className="h-4 w-4 text-muted-foreground" />
                  <span>투표 {profile.stats.vote_count}개</span>
                </div>
              </div>

              {/* 최근 댓글 */}
              {profile.recent_comments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">최근 댓글</h4>
                  <div className="space-y-3">
                    {profile.recent_comments.slice(0, 2).map((comment) => (
                      <div key={comment.id} className="text-sm border-l-2 pl-3">
                        <p className="text-muted-foreground text-xs mb-1">
                          {comment.issues.title}
                        </p>
                        <p className="line-clamp-2 mb-1">{comment.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(comment.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleViewFullProfile} className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            프로필 자세히 보기
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              닫기
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}