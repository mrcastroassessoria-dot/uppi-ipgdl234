import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')

  if (!input) {
    return NextResponse.json({ error: 'Input is required' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:br&language=pt-BR`
    )

    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[v0] Places API error:', data.status, data.error_message)
      return NextResponse.json({ predictions: [] })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Autocomplete error:', error)
    return NextResponse.json({ error: 'Failed to get predictions' }, { status: 500 })
  }
}
