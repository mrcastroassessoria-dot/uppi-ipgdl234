'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * Auto-switches between light/dark mode based on time of day.
 * Light mode: 6am - 6pm
 * Dark mode: 6pm - 6am
 * 
 * Only activates when theme is set to 'system' or 'auto'.
 * Respects manual override - if user explicitly picked 'light' or 'dark', this does nothing.
 */
export function AutoTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    // Only auto-switch if user hasn't manually chosen a theme
    const userPreference = localStorage.getItem('uppi-theme-preference')
    if (userPreference === 'manual') return

    function applyTimeBasedTheme() {
      const hour = new Date().getHours()
      const shouldBeDark = hour >= 18 || hour < 6
      const targetTheme = shouldBeDark ? 'dark' : 'light'

      if (resolvedTheme !== targetTheme) {
        setTheme(targetTheme)
      }
    }

    applyTimeBasedTheme()

    // Check every 5 minutes for transition
    const interval = setInterval(applyTimeBasedTheme, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [resolvedTheme, setTheme, theme])

  return null
}

/**
 * Call this when user manually toggles theme to stop auto-switching.
 */
export function setManualThemePreference() {
  localStorage.setItem('uppi-theme-preference', 'manual')
}

/**
 * Call this to re-enable auto theme switching.
 */
export function clearManualThemePreference() {
  localStorage.removeItem('uppi-theme-preference')
}
