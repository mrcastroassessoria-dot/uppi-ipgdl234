'use client'

import { useEffect } from 'react'
import { initOfflineHandling } from '@/lib/utils/offline-handler'

export function OfflineInitializer() {
  useEffect(() => {
    initOfflineHandling()
  }, [])

  return null
}
