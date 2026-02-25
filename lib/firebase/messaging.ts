'use client'

import { firebaseConfig, vapidKey } from './config'

let messaging: any = null

/**
 * Initialize Firebase Messaging
 * Only runs in browser and if FCM is supported
 */
export async function initMessaging() {
  if (typeof window === 'undefined') return null
  
  try {
    const { getApp, getApps, initializeApp } = await import('firebase/app')
    const { getMessaging, isSupported } = await import('firebase/messaging')

    const supported = await isSupported()
    if (!supported) {
      console.log('[v0] FCM not supported in this browser')
      return null
    }

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    messaging = getMessaging(app)
    return messaging
  } catch (error) {
    console.error('[v0] FCM initialization failed:', error)
    return null
  }
}

/**
 * Request notification permission and get FCM token
 * Returns token if successful, null otherwise
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !messaging) return null

  try {
    const { getToken } = await import('firebase/messaging')

    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      console.log('[v0] Notification permission denied')
      return null
    }

    const currentToken = await getToken(messaging, { vapidKey })
    
    if (currentToken) {
      console.log('[v0] FCM token obtained:', currentToken.slice(0, 20) + '...')
      return currentToken
    } else {
      console.log('[v0] No FCM token available')
      return null
    }
  } catch (error) {
    console.error('[v0] Error getting FCM token:', error)
    return null
  }
}

/**
 * Listen for foreground messages (when app is open)
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {}

  import('firebase/messaging').then(({ onMessage }) => {
    onMessage(messaging, (payload: any) => {
      console.log('[v0] Foreground message received:', payload)
      callback(payload)
    })
  })

  return () => {}
}

/**
 * Save FCM token to user profile in Supabase
 */
export async function saveFCMToken(token: string, supabase: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: token, fcm_token_updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) throw error
    
    console.log('[v0] FCM token saved to profile')
    return true
  } catch (error) {
    console.error('[v0] Error saving FCM token:', error)
    return false
  }
}
