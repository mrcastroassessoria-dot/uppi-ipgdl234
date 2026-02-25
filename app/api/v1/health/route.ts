import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENT_VERSION, SUPPORTED_VERSIONS, LATEST_VERSION } from '@/lib/api/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  // Check Supabase connectivity
  let dbStatus = 'unknown'
  let dbLatency = 0
  try {
    const dbStart = Date.now()
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    dbLatency = Date.now() - dbStart
    dbStatus = error ? 'degraded' : 'healthy'
  } catch {
    dbStatus = 'down'
  }

  // Check Google Maps API
  const mapsStatus = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'configured' : 'missing'

  const overallStatus = dbStatus === 'healthy' ? 'ok' : dbStatus === 'degraded' ? 'degraded' : 'error'

  return NextResponse.json(
    {
      status: overallStatus,
      version: CURRENT_VERSION,
      supported_versions: SUPPORTED_VERSIONS,
      latest_version: LATEST_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime?.() || null,
      latency_ms: Date.now() - start,
      services: {
        database: { status: dbStatus, latency_ms: dbLatency },
        maps: { status: mapsStatus },
        auth: { status: dbStatus === 'healthy' ? 'healthy' : 'unknown' },
      },
    },
    {
      status: overallStatus === 'ok' ? 200 : 503,
      headers: {
        'X-API-Version': CURRENT_VERSION,
        'X-Supported-Versions': SUPPORTED_VERSIONS.join(', '),
        'X-Latest-Version': LATEST_VERSION,
        'Cache-Control': 'no-store',
      },
    }
  )
}
