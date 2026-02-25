// =============================================================================
// API Version Middleware
// =============================================================================
// Wraps route handlers with version validation, deprecation warnings,
// and standard version headers.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  type ApiVersion,
  SUPPORTED_VERSIONS,
  LATEST_VERSION,
  DEPRECATED_VERSIONS,
  extractVersion,
} from './config'

interface VersionInfo {
  version: ApiVersion
  isDeprecated: boolean
}

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>>; version: VersionInfo }
) => Promise<NextResponse | Response>

/**
 * Inject standard API version headers into any response.
 */
function addVersionHeaders(
  response: NextResponse | Response,
  version: ApiVersion
): NextResponse {
  const res =
    response instanceof NextResponse
      ? response
      : NextResponse.json(
          response.body ? undefined : { error: 'Unknown error' },
          { status: response.status }
        )

  res.headers.set('X-API-Version', version)
  res.headers.set('X-Supported-Versions', SUPPORTED_VERSIONS.join(', '))
  res.headers.set('X-Latest-Version', LATEST_VERSION)

  if (DEPRECATED_VERSIONS.includes(version)) {
    res.headers.set('Deprecation', 'true')
    res.headers.set(
      'Sunset',
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()
    )
    res.headers.set(
      'Link',
      `</api/${LATEST_VERSION}>; rel="successor-version"`
    )
  }

  return res
}

/**
 * Wrap a route handler with API version validation.
 *
 * @example
 *   // app/api/v1/rides/route.ts
 *   import { withVersioning } from '@/lib/api/version-middleware'
 *
 *   export const GET = withVersioning(async (request, { version }) => {
 *     return NextResponse.json({ rides: [], version: version.version })
 *   })
 */
export function withVersioning(handler: RouteHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    const version = extractVersion(request.nextUrl.pathname)

    if (!version) {
      return NextResponse.json(
        {
          error: 'Versao da API nao especificada',
          message: 'Use /api/v1/... para acessar a API',
          supported_versions: SUPPORTED_VERSIONS,
          latest_version: LATEST_VERSION,
        },
        { status: 400 }
      )
    }

    if (!SUPPORTED_VERSIONS.includes(version)) {
      return NextResponse.json(
        {
          error: `Versao '${version}' nao suportada`,
          supported_versions: SUPPORTED_VERSIONS,
          latest_version: LATEST_VERSION,
        },
        { status: 400 }
      )
    }

    const versionInfo: VersionInfo = {
      version,
      isDeprecated: DEPRECATED_VERSIONS.includes(version),
    }

    try {
      const response = await handler(request, {
        params: context.params,
        version: versionInfo,
      })
      return addVersionHeaders(response, version)
    } catch (error) {
      console.error(`[API ${version}] Error:`, error)
      const errorResponse = NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
      return addVersionHeaders(errorResponse, version)
    }
  }
}

/**
 * Create a JSON response for unversioned API calls.
 * Used in the Edge middleware to reject /api/rides -> should be /api/v1/rides.
 */
export function unversionedApiResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Versao da API obrigatoria',
      message:
        'Todas as chamadas de API devem incluir a versao. Use /api/v1/... em vez de /api/...',
      supported_versions: SUPPORTED_VERSIONS,
      latest_version: LATEST_VERSION,
      example: '/api/v1/health',
    },
    {
      status: 404,
      headers: {
        'X-Supported-Versions': SUPPORTED_VERSIONS.join(', '),
        'X-Latest-Version': LATEST_VERSION,
      },
    }
  )
}
