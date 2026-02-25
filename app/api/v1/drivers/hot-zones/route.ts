import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

export async function GET(request: Request) {
  try {
    // Rate limit: 15 reads per minute
    const rlResult = apiLimiter.check(request, 15)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '5')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 })
    }

    // Get hot zones for driver
    const { data: hotZones, error } = await supabase.rpc('get_hot_zones_for_drivers', {
      driver_lat: lat,
      driver_lng: lng,
      radius_km: radius,
    })

    if (error) {
      console.error('[v0] Error fetching hot zones:', error)
      return NextResponse.json({ error: 'Failed to fetch hot zones' }, { status: 500 })
    }

    return NextResponse.json({ hotZones: hotZones || [] })
  } catch (error) {
    console.error('[v0] Unexpected error in hot zones API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
