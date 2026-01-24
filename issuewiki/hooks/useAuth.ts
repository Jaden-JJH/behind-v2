import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

type UseAuthReturn = {
  user: User | null
  loading: boolean
  signInWithGoogle: (returnUrl?: string) => Promise<void>
  signInWithKakao: (returnUrl?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      setLoading(true)
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Failed to fetch session', error)
      }

      if (isMounted) {
        setUser(data.session?.user ?? null)
        setLoading(false)
      }
    }

    initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return

      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async (returnUrl?: string): Promise<void> => {
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`)

    if (returnUrl) {
      callbackUrl.searchParams.set('returnUrl', returnUrl)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) throw error
  }

  const signInWithKakao = async (returnUrl?: string): Promise<void> => {
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`)

    if (returnUrl) {
      callbackUrl.searchParams.set('returnUrl', returnUrl)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })

    if (error) throw error
  }

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }

  const refreshUser = async (): Promise<void> => {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Failed to refresh user', error)
      return
    }

    setUser(data.user)
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    refreshUser,
  }
}
