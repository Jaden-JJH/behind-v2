import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

type UseAuthReturn = {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
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

  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
  }

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  }
}
