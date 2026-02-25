'use client'

import { iosToast } from './ios-toast'
import { triggerHaptic } from '@/hooks/use-haptic'

export interface RetryConfig {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
  timeout?: number
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  timeout: 10000,
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Wait for online connection
 */
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve()
      return
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline)
      resolve()
    }

    window.addEventListener('online', handleOnline)
  })
}

/**
 * Retry fetch with exponential backoff
 */
export async function retryFetch<T>(
  url: string,
  options?: RequestInit,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, retryDelay, backoffMultiplier, timeout } = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      // Check if online before attempting
      if (!isOnline()) {
        iosToast.error('Sem conexao. Tentando novamente...')
        await waitForOnline()
        iosToast.success('Conexao restaurada')
        triggerHaptic('success')
      }

      // Create timeout controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Attempt fetch
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      lastError = error as Error
      attempt++

      // If max retries reached, throw error
      if (attempt > maxRetries) {
        console.error('[v0] Max retries reached:', error)
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1)

      console.log(`[v0] Retry ${attempt}/${maxRetries} after ${delay}ms`)

      // Show toast on retry
      if (attempt === 1) {
        iosToast.error('Falha na conexao. Tentando novamente...')
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Failed after retries')
}

/**
 * Supabase query with retry logic
 */
export async function retrySupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  config: RetryConfig = {}
): Promise<T> {
  const { maxRetries, retryDelay, backoffMultiplier } = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      // Check if online
      if (!isOnline()) {
        await waitForOnline()
      }

      const { data, error } = await queryFn()

      if (error) {
        throw new Error(error.message || 'Database error')
      }

      if (data === null) {
        throw new Error('No data returned')
      }

      return data
    } catch (error) {
      lastError = error as Error
      attempt++

      if (attempt > maxRetries) {
        throw lastError
      }

      const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Failed after retries')
}

/**
 * Queue failed requests for later retry
 */
class OfflineQueue {
  private queue: Array<{
    id: string
    url: string
    options: RequestInit
    timestamp: number
  }> = []

  add(url: string, options: RequestInit): string {
    const id = `${Date.now()}-${Math.random()}`
    this.queue.push({
      id,
      url,
      options,
      timestamp: Date.now(),
    })
    this.saveToStorage()
    return id
  }

  async processQueue(): Promise<void> {
    if (!isOnline() || this.queue.length === 0) return

    const pending = [...this.queue]
    this.queue = []

    for (const item of pending) {
      try {
        await fetch(item.url, item.options)
      } catch (error) {
        // Re-add to queue if still failing
        this.queue.push(item)
      }
    }

    this.saveToStorage()

    if (this.queue.length === 0) {
      iosToast.success('Todas requisicoes sincronizadas')
      triggerHaptic('success')
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('offline_queue', JSON.stringify(this.queue))
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('offline_queue')
      if (stored) {
        try {
          this.queue = JSON.parse(stored)
        } catch (error) {
          console.error('[v0] Error loading offline queue:', error)
        }
      }
    }
  }

  init(): void {
    this.loadFromStorage()

    // Process queue when coming back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue()
      })
    }
  }
}

export const offlineQueue = new OfflineQueue()

/**
 * Initialize offline handling
 */
export function initOfflineHandling(): void {
  if (typeof window === 'undefined') return

  offlineQueue.init()

  // Listen to online/offline events
  window.addEventListener('offline', () => {
    iosToast.error('Sem conexao com a internet')
    triggerHaptic('error')
  })

  window.addEventListener('online', () => {
    iosToast.success('Conexao restaurada')
    triggerHaptic('success')
    offlineQueue.processQueue()
  })
}
