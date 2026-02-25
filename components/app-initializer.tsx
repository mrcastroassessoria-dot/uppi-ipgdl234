'use client'

import { useEffect } from 'react'
import { initApp } from '@/lib/utils/init-app'

export function AppInitializer() {
  useEffect(() => {
    initApp()
  }, [])

  return null
}
