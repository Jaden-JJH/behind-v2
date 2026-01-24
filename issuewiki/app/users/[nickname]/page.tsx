'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">뒤로 가기</span>
        </button>
        <div className="border border-slate-200 rounded-xl p-6">
          <p className="text-center text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">뒤로 가기</span>
        </button>

        {/* 프로필 정보 */}
        <div className="border border-slate-200 rounded-xl p-6 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">{profile.nickname}</h1>
          <p className="text-sm text-slate-500 mb-4">{profile.joined_at} 가입</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">댓글 {profile.stats.comment_count}개</span>
            </div>
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-600">투표 {profile.stats.vote_count}개</span>
            </div>
          </div>
        </div>

        {/* 최근 댓글 */}
        {profile.recent_comments.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">최근 댓글</h2>
            <div className="space-y-4">
              {profile.recent_comments.map((comment) => (
                <div key={comment.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <p className="text-sm text-slate-500 mb-1">
                    {comment.issues.title}
                  </p>
                  <p className="text-sm text-slate-700 mb-2">{comment.body}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{formatTime(comment.created_at)}</span>
                    <button
                      onClick={() => router.push(`/issues/${comment.issues.display_id}`)}
                      className="text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      이슈 보기 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}