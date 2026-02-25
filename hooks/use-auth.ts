import { useState, useEffect, useCallback } from 'react'
import { authService, AuthUser } from '@/lib/services/auth-service'
import { useRouter } from 'next/navigation'

interface UseAuthResult {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    setLoading(true)
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
    router.push('/auth/welcome')
  }, [router])

  useEffect(() => {
    refreshUser()

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshUser])

  return {
    user,
    loading,
    signOut,
    refreshUser,
  }
}
