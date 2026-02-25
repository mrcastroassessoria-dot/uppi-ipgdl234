import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

export async function GET(request: Request) {
  try {
    // Rate limit: 20 reads per minute
    const rlResult = apiLimiter.check(request, 20)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radiusKm = parseFloat(searchParams.get('radius') || '5')

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 })
    }

    // Query nearby available drivers using PostGIS function
    const vehicleType = searchParams.get('vehicle_type') || null
    
    const { data: drivers, error } = await supabase.rpc('find_nearby_drivers', {
      pickup_lat: lat,
      pickup_lng: lng,
      radius_km: radiusKm,
      vehicle_type_filter: vehicleType,
    })

    if (error) {
      console.error('[v0] Error fetching nearby drivers:', error)
      return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      drivers: drivers || [],
      count: drivers?.length || 0
    })
  } catch (error) {
    console.error('[v0] Unexpected error in nearby drivers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
