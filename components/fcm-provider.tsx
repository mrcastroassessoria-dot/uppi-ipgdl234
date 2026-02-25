'use client'

import { useEffect } from 'react'
import { useFCM } from '@/hooks/use-fcm'
import { saveFCMToken } from '@/lib/firebase/messaging'
import { createClient } from '@/lib/supabase/client'

/**
 * FCMProvider - Handles Firebase Cloud Messaging setup
 * Place this in the root layout to enable push notifications app-wide
 * Automatically requests notification permission and saves FCM token to Supabase
 */
export function FCMProvider() {
  const supabase = createClient()
  const { token, permission, setupForegroundListener } = useFCM()

  useEffect(() => {
    // Save token to database when we get it
    if (token) {
      saveFCMToken(token, supabase)
    }
  }, [token, supabase])

  useEffect(() => {
    // Listen to foreground messages
    const unsubscribe = setupForegroundListener((payload) => {
      console.log('[v0] Foreground message:', payload)
    })
    return unsubscribe
  }, [setupForegroundListener])

  // Show permission status in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[v0] FCM Permission:', permission)
      console.log('[v0] FCM Token:', token ? `${token.substring(0, 20)}...` : 'None')
    }
  }, [permission, token])

  return null
}
