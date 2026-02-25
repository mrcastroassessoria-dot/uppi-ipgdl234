import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const place_id = searchParams.get('place_id')

  if (!place_id) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}&fields=geometry,formatted_address&language=pt-BR`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('[v0] Place Details error:', data.status, data.error_message)
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Place details error:', error)
    return NextResponse.json({ error: 'Failed to get place details' }, { status: 500 })
  }
}
