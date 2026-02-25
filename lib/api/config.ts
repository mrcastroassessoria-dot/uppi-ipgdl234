// =============================================================================
// API Versioning Configuration
// =============================================================================
// Central configuration for API versioning. When migrating to v2,
// update CURRENT_VERSION and add 'v2' to SUPPORTED_VERSIONS.
// =============================================================================

export const API_VERSIONS = {
  V1: 'v1',
} as const

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS]

/** Current active API version */
export const CURRENT_VERSION: ApiVersion = API_VERSIONS.V1

/** All versions the server will accept */
export const SUPPORTED_VERSIONS: ApiVersion[] = [API_VERSIONS.V1]

/** Versions marked as deprecated (still functional but with warning headers) */
export const DEPRECATED_VERSIONS: ApiVersion[] = []

/** Latest stable version for redirects and documentation */
export const LATEST_VERSION: ApiVersion = API_VERSIONS.V1

/** Base path for the current API version */
export const API_BASE = `/api/${CURRENT_VERSION}` as const

/**
 * Build a full API URL from a resource path.
 *
 * @example
 *   apiUrl('/rides')          // => '/api/v1/rides'
 *   apiUrl('/offers/123')     // => '/api/v1/offers/123'
 *   apiUrl('/rides', 'v2')    // => '/api/v2/rides'
 */
export function apiUrl(path: string, version?: ApiVersion): string {
  const v = version ?? CURRENT_VERSION
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `/api/${v}${cleanPath}`
}

/**
 * Extract the version segment from a request URL.
 * Returns null if no valid version is found.
 *
 * @example
 *   extractVersion('/api/v1/rides')  // => 'v1'
 *   extractVersion('/api/rides')     // => null
 */
export function extractVersion(pathname: string): ApiVersion | null {
  const match = pathname.match(/^\/api\/(v\d+)/)
  if (!match) return null
  const version = match[1] as ApiVersion
  return SUPPORTED_VERSIONS.includes(version) ? version : null
}

/**
 * Check whether a pathname is an unversioned API call (e.g. /api/rides).
 */
export function isUnversionedApiCall(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false
  // Check it doesn't start with /api/v{number}
  return !/^\/api\/v\d+/.test(pathname)
}

/**
 * Check whether a version is deprecated.
 */
export function isDeprecatedVersion(version: ApiVersion): boolean {
  return DEPRECATED_VERSIONS.includes(version)
}
