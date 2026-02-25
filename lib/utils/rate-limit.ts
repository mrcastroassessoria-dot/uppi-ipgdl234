/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 * 
 * Usage in API route:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 })
 *   const { success } = await limiter.check(request, 10) // 10 requests per minute
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const tokenBuckets = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup(interval: number) {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of tokenBuckets.entries()) {
      if (now > entry.resetTime) {
        tokenBuckets.delete(key)
      }
    }
  }, interval * 5)
}

interface RateLimitConfig {
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  interval?: number
  /** Max unique IPs to track (default: 500) */
  uniqueTokenPerInterval?: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function rateLimit(config: RateLimitConfig = {}) {
  const { interval = 60_000, uniqueTokenPerInterval = 500 } = config
  ensureCleanup(interval)

  return {
    check(request: Request, limit: number): RateLimitResult {
      const ip = getClientIP(request)
      const key = `${ip}`
      const now = Date.now()

      // Clean up if we've exceeded max unique tokens
      if (tokenBuckets.size > uniqueTokenPerInterval) {
        const oldest = Array.from(tokenBuckets.entries())
          .sort((a, b) => a[1].resetTime - b[1].resetTime)
        
        // Remove oldest 20%
        const removeCount = Math.floor(oldest.length * 0.2)
        for (let i = 0; i < removeCount; i++) {
          tokenBuckets.delete(oldest[i][0])
        }
      }

      const existing = tokenBuckets.get(key)

      if (!existing || now > existing.resetTime) {
        // New window
        tokenBuckets.set(key, { count: 1, resetTime: now + interval })
        return { success: true, limit, remaining: limit - 1, reset: now + interval }
      }

      if (existing.count >= limit) {
        return { success: false, limit, remaining: 0, reset: existing.resetTime }
      }

      existing.count++
      return { success: true, limit, remaining: limit - existing.count, reset: existing.resetTime }
    },
  }
}

function getClientIP(request: Request): string {
  const headers = new Headers(request.headers)
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/**
 * Helper to create a rate-limited JSON response
 */
export function rateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: 'Muitas requisicoes. Tente novamente em alguns segundos.',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  )
}

// Pre-configured limiters for common use cases
export const apiLimiter = rateLimit({ interval: 60_000 }) // 1 min window
export const authLimiter = rateLimit({ interval: 300_000 }) // 5 min window for auth
export const offerLimiter = rateLimit({ interval: 30_000 }) // 30s window for offers
