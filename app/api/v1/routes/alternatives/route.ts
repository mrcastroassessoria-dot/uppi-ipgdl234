import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface RouteAlternative {
  routeIndex: number
  distance: number
  duration: number
  distanceText: string
  durationText: string
  polyline: string
  summary: string
  basePrice: number
  estimatedPrice: number
  priceModifier: number
  warnings: string[]
}

export async function POST(request: Request) {
  try {
    // Rate limit: 10 route calculations per minute
    const rlResult = apiLimiter.check(request, 10)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { origin, destination, vehicleType } = body

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return NextResponse.json({ error: 'Invalid origin or destination' }, { status: 400 })
    }

    // Call Google Directions API with alternatives
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(directionsUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch directions')
    }

    const data = await response.json()

    if (data.status !== 'OK' || !data.routes?.length) {
      return NextResponse.json({ error: 'No routes found', status: data.status }, { status: 404 })
    }

    // Base pricing per km based on vehicle type
    const basePricePerKm: Record<string, number> = {
      economy: 2.5,
      electric: 3.0,
      premium: 4.5,
      suv: 5.0,
      moto: 1.8,
    }

    const pricePerKm = basePricePerKm[vehicleType as string] || basePricePerKm.economy

    // Process each route alternative
    const alternatives: RouteAlternative[] = data.routes.map((route: any, index: number) => {
      const leg = route.legs[0]
      const distanceKm = leg.distance.value / 1000
      const durationMin = leg.duration.value / 60

      // Calculate base price
      const basePrice = distanceKm * pricePerKm + 5 // R$5 base fare

      // Apply modifiers based on route characteristics
      let priceModifier = 1.0
      let warnings: string[] = []

      // Fastest route usually has slight premium
      if (index === 0) {
        priceModifier = 1.05
      }

      // Longer distance routes get discount
      if (index > 0) {
        const mainRoute = data.routes[0]
        const mainDistance = mainRoute.legs[0].distance.value / 1000
        if (distanceKm > mainDistance * 1.15) {
          priceModifier = 0.92
          warnings.push('Rota mais longa, mas com desconto')
        }
      }

      // Highway routes (faster speed) get small premium
      if (route.summary.toLowerCase().includes('rod.') || route.summary.toLowerCase().includes('br-')) {
        priceModifier *= 1.03
        warnings.push('Inclui rodovia')
      }

      // Toll roads
      if (route.warnings?.some((w: string) => w.toLowerCase().includes('toll'))) {
        warnings.push('Pode incluir pedágio')
      }

      const estimatedPrice = basePrice * priceModifier

      return {
        routeIndex: index,
        distance: distanceKm,
        duration: durationMin,
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        polyline: route.overview_polyline.points,
        summary: route.summary || `Rota ${index + 1}`,
        basePrice,
        estimatedPrice,
        priceModifier,
        warnings,
      }
    })

    // Sort by estimated price (cheapest first)
    alternatives.sort((a, b) => a.estimatedPrice - b.estimatedPrice)

    return NextResponse.json({
      alternatives,
      count: alternatives.length,
    })
  } catch (error) {
    console.error('[v0] Error fetching alternative routes:', error)
    return NextResponse.json({ error: 'Failed to calculate routes' }, { status: 500 })
  }
}
