/**
 * Fetch wrapper with automatic retry, exponential backoff, and timeout.
 * 
 * Usage:
 *   const data = await fetchWithRetry('/api/v1/offers', { maxRetries: 3 })
 *   const data = await fetchWithRetry('/api/v1/rides', { timeout: 8000 })
 */

interface FetchRetryOptions extends RequestInit {
  /** Max number of retries (default: 3) */
  maxRetries?: number
  /** Base delay in ms before retry (default: 1000). Uses exponential backoff. */
  baseDelay?: number
  /** Max delay cap in ms (default: 10000) */
  maxDelay?: number
  /** Request timeout in ms (default: 15000) */
  timeout?: number
  /** Callback when a retry happens */
  onRetry?: (attempt: number, error: Error) => void
  /** Only retry on these status codes (default: [408, 429, 500, 502, 503, 504]) */
  retryStatusCodes?: number[]
}

interface FetchRetryResult<T = unknown> {
  data: T | null
  error: string | null
  status: number
  ok: boolean
  retries: number
}

const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]

export async function fetchWithRetry<T = unknown>(
  url: string,
  options: FetchRetryOptions = {}
): Promise<FetchRetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeout = 15000,
    onRetry,
    retryStatusCodes = DEFAULT_RETRY_STATUS_CODES,
    ...fetchOptions
  } = options

  let lastError: Error | null = null
  let retries = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // If rate limited, respect Retry-After header
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : getBackoffDelay(attempt, baseDelay, maxDelay)

        if (attempt < maxRetries) {
          retries++
          onRetry?.(attempt + 1, new Error('Rate limited'))
          await sleep(waitTime)
          continue
        }
      }

      // Check if we should retry on this status code
      if (!response.ok && retryStatusCodes.includes(response.status) && attempt < maxRetries) {
        retries++
        onRetry?.(attempt + 1, new Error(`HTTP ${response.status}`))
        await sleep(getBackoffDelay(attempt, baseDelay, maxDelay))
        continue
      }

      // Parse response
      const contentType = response.headers.get('content-type')
      let data: T | null = null

      if (contentType?.includes('application/json')) {
        data = await response.json()
      }

      if (!response.ok) {
        const errorData = data as Record<string, unknown> | null
        return {
          data: null,
          error: (errorData?.error as string) || `HTTP ${response.status}`,
          status: response.status,
          ok: false,
          retries,
        }
      }

      return { data, error: null, status: response.status, ok: true, retries }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't retry on abort (user cancelled) unless it was our timeout
      if (lastError.name === 'AbortError' && attempt < maxRetries) {
        retries++
        onRetry?.(attempt + 1, lastError)
        await sleep(getBackoffDelay(attempt, baseDelay, maxDelay))
        continue
      }

      // Network errors - retry
      if (attempt < maxRetries && isNetworkError(lastError)) {
        retries++
        onRetry?.(attempt + 1, lastError)
        await sleep(getBackoffDelay(attempt, baseDelay, maxDelay))
        continue
      }
    }
  }

  return {
    data: null,
    error: lastError?.message || 'Erro de conexao. Verifique sua internet.',
    status: 0,
    ok: false,
    retries,
  }
}

/**
 * POST with retry
 */
export async function postWithRetry<T = unknown>(
  url: string,
  body: Record<string, unknown>,
  options: FetchRetryOptions = {}
): Promise<FetchRetryResult<T>> {
  return fetchWithRetry<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    body: JSON.stringify(body),
    ...options,
  })
}

// --- Helpers ---

function getBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * baseDelay * 0.5
  return Math.min(exponentialDelay + jitter, maxDelay)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isNetworkError(error: Error): boolean {
  return (
    error.name === 'TypeError' ||
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('Network request failed') ||
    error.name === 'AbortError'
  )
}
