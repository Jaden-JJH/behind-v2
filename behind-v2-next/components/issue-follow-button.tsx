'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Heart } from 'lucide-react'

interface IssueFollowButtonProps {
  issueId: string
  initialFollowing?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function IssueFollowButton({
  issueId,
  initialFollowing = false,
  variant = 'outline',
  size = 'sm'
}: IssueFollowButtonProps) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check current follow status
  useEffect(() => {
    if (!user) {
      setFollowing(false)
      return
    }

    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/issues/${issueId}/follow`)
        if (response.ok) {
          const data = await response.json()
          setFollowing(data.data?.following || false)
        }
      } catch (error) {
        console.error('Failed to check follow status:', error)
      }
    }

    checkFollowStatus()
  }, [user, issueId])

  const handleToggle = useCallback(async () => {
    if (!user) {
      setError('로그인이 필요합니다')
      return
    }

    setIsLoading(true)
    setError(null)

    const previousState = following

    try {
      const method = following ? 'DELETE' : 'POST'

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf-token='))
        ?.split('=')[1]

      // Optimistic UI update
      setFollowing(!following)

      const response = await fetch(`/api/issues/${issueId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || ''
        }
      })

      if (!response.ok) {
        throw new Error('Failed to update follow status')
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
      setError('요청 중 오류가 발생했습니다')
      setFollowing(previousState)
    } finally {
      setIsLoading(false)
    }
  }, [issueId, user, following])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading || !user}
      className={`gap-2 ${following ? 'text-red-600 bg-red-50 hover:bg-red-100' : ''}`}
    >
      <Heart
        className={`w-4 h-4 ${following ? 'fill-current' : ''}`}
      />
      {following ? '팔로우 중' : '팔로우'}
    </Button>
  )
}