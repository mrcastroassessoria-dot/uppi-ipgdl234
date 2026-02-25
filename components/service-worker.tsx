'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * TWA-ready Service Worker registration.
 * - Registers SW for caching (required by TWA/Play Store)
 * - BLOCKS the browser "Add to Home Screen" prompt (install only via Play Store)
 */
export function ServiceWorkerRegistration() {
  const pathname = usePathname()

  // Register service worker (required for TWA)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail - SW is not critical for functionality
    })
  }, [])

  // BLOCK browser install prompt - users should only install from Play Store
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      // Do NOT show the browser install prompt
      // The app is installed via Play Store TWA only
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Prefetch likely next routes using native <link rel="prefetch">
  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefetchMap: Record<string, string[]> = {
      '/uppi/home': ['/uppi/ride/route-input', '/uppi/history', '/uppi/profile', '/uppi/wallet'],
      '/uppi/ride/route-input': ['/uppi/ride/select'],
      '/uppi/ride/select': ['/uppi/request-ride'],
      '/uppi/profile': ['/uppi/achievements', '/uppi/club', '/uppi/settings'],
      '/uppi/driver': ['/uppi/driver/earnings'],
    }

    const urls = prefetchMap[pathname]
    if (!urls?.length) return

    // Small delay to not compete with page load
    const timer = setTimeout(() => {
      urls.forEach((url) => {
        // Use native link prefetch
        const existing = document.querySelector(`link[href="${url}"]`)
        if (existing) return

        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = url
        link.as = 'document'
        document.head.appendChild(link)
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
