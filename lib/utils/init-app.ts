/**
 * Initialize app on mount
 * Call this in layout.tsx or root component
 */

export function initApp() {
  if (typeof window === 'undefined') return

  // Log app init
  console.log('[v0] App initialized')

  // Service Worker registration (if exists)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('[v0] SW registration failed:', error)
    })
  }

  // Handle app visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[v0] App became visible')
      // Could trigger data refresh here
    }
  })
}
