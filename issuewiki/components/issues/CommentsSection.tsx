'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Flag, AlertTriangle } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { showSuccess, showError, handleApiResponse } from '@/lib/toast-utils'
import { csrfFetch } from '@/lib/csrf-client'
import { useAuth } from '@/hooks/useAuth'
import { generateUUID } from '@/lib/uuid'

function getDeviceHash(): string {
  if (typeof window === 'undefined') return ''
  let hash = localStorage.getItem('deviceHash')
  if (!hash) {
    hash = generateUUID()
    localStorage.setItem('deviceHash', hash)
  }
  return hash
}

interface CommentsSectionProps {
  issueId: string
  onOpenProfile: (nickname: string) => void
  onOpenReport: (type: 'comment', id: string) => void
}

export function CommentsSection({ issueId, onOpenProfile, onOpenReport }: CommentsSectionProps) {
  const { user, signInWithGoogle } = useAuth()
  const [comments, setComments] = useState<any[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null)
  const [voteStates, setVoteStates] = useState<Record<string, 'up' | 'down' | null>>({})
  const [lastVoteCommentId, setLastVoteCommentId] = useState<string | null>(null)
  const [lastVoteTime, setLastVoteTime] = useState(0)

  const saveVoteState = (commentId: string, voteType: 'up' | 'down' | null) => {
    if (typeof window === 'undefined') return
    const key = `comment_vote_${commentId}`
    if (voteType === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, voteType)
    }
  }

  const loadVoteState = (commentId: string): 'up' | 'down' | null => {
    if (typeof window === 'undefined') return null
    const key = `comment_vote_${commentId}`
    const saved = localStorage.getItem(key)
    return saved as 'up' | 'down' | null
  }

  useEffect(() => {
    if (comments.length > 0) {
      const states: Record<string, 'up' | 'down' | null> = {}
      comments.forEach((comment) => {
        states[comment.id] = loadVoteState(comment.id)
      })
      setVoteStates(states)
    }
  }, [comments.length])

  useEffect(() => {
    loadComments()
  }, [issueId, sortBy])

  async function loadComments() {
    try {
      setCommentsLoading(true)
      setCommentsError('')
      const response = await fetch(`/api/comments?issueId=${issueId}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || '댓글을 불러오지 못했습니다')

      let sortedComments = data.data || []

      if (sortBy === 'popular') {
        sortedComments = sortedComments.sort((a: any, b: any) =>
          (b.up - b.down) - (a.up - a.down)
        )
      }

      setComments(sortedComments)
    } catch (err: any) {
      setCommentsError(err.message)
      setComments([])
      showError(err)
    } finally {
      setCommentsLoading(false)
    }
  }

  async function handleSubmitComment() {
    if (!user) {
      showError('로그인이 필요합니다')
      return
    }

    if (!commentBody.trim()) {
      showError('댓글 내용을 입력해주세요')
      return
    }

    if (commentBody.length < 2 || commentBody.length > 500) {
      showError('댓글은 2자 이상 500자 이하로 작성해주세요')
      return
    }

    const nick = user.user_metadata?.nickname || '익명'

    try {
      setSubmitting(true)
      const response = await csrfFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issueId,
          body: commentBody,
          userNick: nick
        })
      })

      await handleApiResponse(response)

      setCommentBody('')
      showSuccess('댓글이 등록되었습니다')
      loadComments()
    } catch (err: any) {
      showError(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVote(commentId: string, voteType: 'up' | 'down') {
    if (votingCommentId) return

    if (lastVoteCommentId && lastVoteCommentId !== commentId) {
      const timeSinceLastVote = Date.now() - lastVoteTime
      if (timeSinceLastVote < 2000) {
        showError('잠시 후 다시 시도해주세요')
        return
      }
    }

    try {
      setVotingCommentId(commentId)
      const deviceHash = getDeviceHash()
      const currentVote = voteStates[commentId]

      const response = await csrfFetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType, deviceHash }),
      })

      const result = await handleApiResponse<{ up: number; down: number }>(response)
      const { up, down } = result

      const newState = currentVote === voteType ? null : voteType

      setVoteStates(prev => ({ ...prev, [commentId]: newState }))
      saveVoteState(commentId, newState)

      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, up, down } : c))
      )

      setLastVoteCommentId(commentId)
      setLastVoteTime(Date.now())
    } catch (err: any) {
      showError(err)
    } finally {
      setVotingCommentId(null)
    }
  }

  return (
    <div id="comments" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>댓글</h2>
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'popular')}>
          <TabsList>
            <TabsTrigger value="popular">인기순</TabsTrigger>
            <TabsTrigger value="recent">최신순</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 댓글 작성 */}
      {!user ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">
              로그인하고 댓글을 남겨보세요
            </p>
            <Button onClick={() => signInWithGoogle(window.location.pathname)}>
              구글로 로그인
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-3 md:p-4">
            <Textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="댓글을 남겨보세요"
              className="min-h-[80px] md:min-h-[100px] mb-2 md:mb-3 resize-none"
              disabled={submitting}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {user.user_metadata?.nickname || '익명'} · 커뮤니티 가이드라인 준수
              </p>
              <Button onClick={handleSubmitComment} disabled={submitting}>
                {submitting ? '등록 중...' : '등록'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 댓글 목록 */}
      {commentsLoading && (
        <div className="text-center py-8 text-muted-foreground">
          댓글을 불러오는 중...
        </div>
      )}

      {commentsError && (
        <div className="text-center py-8 text-red-500">
          {commentsError}
        </div>
      )}

      {!commentsLoading && !commentsError && comments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          첫 댓글을 남겨보세요!
        </div>
      )}

      {!commentsLoading && !commentsError && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{c.user_nick.slice(-1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      {c.user_nick ? (
                        <button
                          onClick={() => onOpenProfile(c.user_nick)}
                          className="text-sm hover:underline cursor-pointer text-left bg-transparent border-none p-0"
                        >
                          {c.user_nick}
                        </button>
                      ) : (
                        <p className="text-sm text-muted-foreground">익명</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatTime(c.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenReport('comment', c.id)}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>
                {c.is_blinded ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2 md:mb-3">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        블라인드 처리된 댓글입니다
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-2 md:mb-3">{c.body}</p>
                )}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Button
                    variant={voteStates[c.id] === 'up' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVote(c.id, 'up')}
                    disabled={votingCommentId === c.id}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                    {c.up}
                  </Button>
                  <Button
                    variant={voteStates[c.id] === 'down' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVote(c.id, 'down')}
                    disabled={votingCommentId === c.id}
                  >
                    <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
                    {c.down}
                  </Button>
                  <Button variant="ghost" size="sm">
                    답글
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
