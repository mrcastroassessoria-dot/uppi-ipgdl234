'use client'

import { useEffect, useState } from 'react'
import { initMessaging, requestNotificationPermission, onForegroundMessage, saveFCMToken } from '@/lib/firebase/messaging'
import { createClient } from '@/lib/supabase/client'
import { iosToast } from '@/lib/utils/ios-toast'

export function useFCM() {
  const [token, setToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Initialize FCM
    initMessaging().then((messaging) => {
      setIsSupported(!!messaging)
    })

    // Check current permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    const fcmToken = await requestNotificationPermission()
    
    if (fcmToken) {
      setToken(fcmToken)
      setPermission('granted')
      
      // Save token to Supabase
      const supabase = createClient()
      await saveFCMToken(fcmToken, supabase)
      
      iosToast.success('Notificacoes ativadas')
      return fcmToken
    } else {
      setPermission(Notification.permission)
      iosToast.error('Permissao negada')
      return null
    }
  }

  const setupForegroundListener = (callback: (payload: any) => void) => {
    return onForegroundMessage(callback)
  }

  return {
    token,
    permission,
    isSupported,
    requestPermission,
    setupForegroundListener,
  }
}
