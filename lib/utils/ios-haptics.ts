/**
 * iOS-style Haptic Feedback System
 * Provides native-like haptic feedback patterns for web
 */

export type HapticPattern = 
  | 'selection' 
  | 'light' 
  | 'medium' 
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'rigid'
  | 'soft'

interface HapticConfig {
  pattern: number[]
  intensity?: number
}

const HAPTIC_PATTERNS: Record<HapticPattern, HapticConfig> = {
  selection: { pattern: [10], intensity: 0.3 },
  light: { pattern: [10], intensity: 0.5 },
  medium: { pattern: [15], intensity: 0.7 },
  heavy: { pattern: [20], intensity: 1.0 },
  success: { pattern: [10, 30, 10], intensity: 0.6 },
  warning: { pattern: [15, 30, 15], intensity: 0.7 },
  error: { pattern: [20, 40, 20, 40, 20], intensity: 0.8 },
  rigid: { pattern: [5], intensity: 0.9 },
  soft: { pattern: [20], intensity: 0.4 },
}

class HapticFeedback {
  private isSupported: boolean = false
  private isEnabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'vibrate' in navigator
      
      // Check user preference from localStorage
      const savedPref = localStorage.getItem('uppi_haptics_enabled')
      this.isEnabled = savedPref !== 'false'
    }
  }

  /**
   * Trigger haptic feedback
   */
  trigger(pattern: HapticPattern = 'light') {
    if (!this.isSupported || !this.isEnabled) return

    const config = HAPTIC_PATTERNS[pattern]
    if (!config) return

    try {
      navigator.vibrate(config.pattern)
    } catch (error) {
      console.warn('[Haptics] Vibration failed:', error)
    }
  }

  /**
   * Custom haptic pattern
   */
  custom(pattern: number[]) {
    if (!this.isSupported || !this.isEnabled) return

    try {
      navigator.vibrate(pattern)
    } catch (error) {
      console.warn('[Haptics] Custom vibration failed:', error)
    }
  }

  /**
   * Enable/disable haptics
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('uppi_haptics_enabled', enabled.toString())
    }
  }

  /**
   * Check if haptics are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * Check if device supports haptics
   */
  getSupported(): boolean {
    return this.isSupported
  }

  /**
   * Predefined interaction patterns
   */
  interactions = {
    buttonPress: () => this.trigger('light'),
    toggleOn: () => this.trigger('success'),
    toggleOff: () => this.trigger('selection'),
    swipe: () => this.trigger('selection'),
    longPress: () => this.trigger('medium'),
    delete: () => this.trigger('warning'),
    confirmation: () => this.trigger('success'),
    cancellation: () => this.trigger('rigid'),
    notification: () => this.custom([10, 50, 10]),
    achieved: () => this.custom([10, 30, 10, 30, 10, 80]),
    pullToRefresh: () => this.trigger('rigid'),
  }
}

// Singleton instance
export const haptics = new HapticFeedback()

// Convenience function for backward compatibility
export function triggerHaptic(pattern: HapticPattern = 'light') {
  haptics.trigger(pattern)
}
