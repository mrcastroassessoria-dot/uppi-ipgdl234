import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    console.log('[v0] Geocode API - Key available:', apiKey ? 'YES' : 'NO')

    if (!apiKey) {
      console.error('[v0] Geocode API - API key missing!')
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR`
    console.log('[v0] Geocode API - Calling Google Maps...')
    
    const response = await fetch(url)
    const data = await response.json()

    console.log('[v0] Geocode API - Google response status:', data.status)

    if (data.status === 'OK' && data.results.length > 0) {
      console.log('[v0] Geocode API - Address found:', data.results[0].formatted_address)
      return NextResponse.json({
        address: data.results[0].formatted_address,
        results: data.results,
      })
    }

    console.log('[v0] Geocode API - No results or error:', data.status, data.error_message)
    return NextResponse.json({ address: null, error: data.error_message || 'No results found' })
  } catch (error) {
    console.error('[v0] Geocode error:', error)
    return NextResponse.json({ error: 'Failed to geocode' }, { status: 500 })
  }
}
