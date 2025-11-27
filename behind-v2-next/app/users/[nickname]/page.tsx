'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Vote } from "lucide-react"
import { formatTime } from "@/lib/utils"

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

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const nickname = params.nickname as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${encodeURIComponent(nickname)}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('사용자를 찾을 수 없습니다')
          } else {
            setError('프로필을 불러오는 중 오류가 발생했습니다')
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
  }, [nickname])

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로 가기
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        뒤로 가기
      </Button>

      {/* 프로필 정보 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{profile.nickname}</CardTitle>
          <p className="text-sm text-muted-foreground">{profile.joined_at} 가입</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">댓글 {profile.stats.comment_count}개</span>
            </div>
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">투표 {profile.stats.vote_count}개</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 댓글 */}
      {profile.recent_comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>최근 댓글</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.recent_comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-0">
                  <p className="text-sm text-muted-foreground mb-1">
                    {comment.issues.title}
                  </p>
                  <p className="text-sm mb-2">{comment.body}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatTime(comment.created_at)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/issues/${comment.issues.display_id}`)}
                    >
                      이슈 보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}