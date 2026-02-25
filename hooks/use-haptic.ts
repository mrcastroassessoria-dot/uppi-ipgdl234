'use client'

/**
 * Haptic feedback utility for iOS-like tactile responses.
 * Uses the Vibration API (supported on most mobile browsers).
 * Falls back silently on unsupported devices.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

const patterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [40, 30, 40, 30, 40],
  selection: 5,
}

function triggerHaptic(style: HapticStyle = 'light') {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(patterns[style])
    }
  } catch {
    // Silently fail on unsupported devices
  }
}

export function useHaptic() {
  return {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    selection: () => triggerHaptic('selection'),
    trigger: triggerHaptic,
  }
}

// Standalone function for use outside React components
export { triggerHaptic }
