import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { offerLimiter, apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limit: 5 offer creations per 30 seconds
    const rlResult = offerLimiter.check(request, 5)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ride_id, offered_price, estimated_arrival_minutes, message } = body

    // Check if user is a driver
    const { data: driver } = await supabase
      .from('drivers')
      .select('id, user_id, status, vehicles(id, type)')
      .eq('user_id', user.id)
      .single()

    if (!driver || driver.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved drivers can make offers' }, { status: 403 })
    }

    if (!driver.vehicles || driver.vehicles.length === 0) {
      return NextResponse.json({ error: 'Driver must have a registered vehicle' }, { status: 400 })
    }

    // Set expiration time (5 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    // Create offer
    const { data: offer, error } = await supabase
      .from('ride_offers')
      .insert({
        ride_id,
        driver_id: driver.id,
        vehicle_id: driver.vehicles[0].id,
        offered_price: offered_price || 0,
        estimated_arrival_minutes: estimated_arrival_minutes || 5,
        message,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select(`
        *,
        driver:drivers(
          id,
          rating,
          total_rides,
          user:users(id, full_name, avatar_url, phone)
        ),
        vehicle:vehicles(id, make, model, color, license_plate, type)
      `)
      .single()

    if (error) {
      console.error('[v0] Error creating offer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify passenger about new offer
    try {
      const { data: ride } = await supabase
        .from('rides')
        .select('passenger_id')
        .eq('id', ride_id)
        .single()

      if (ride) {
        await supabase.from('notifications').insert({
          user_id: ride.passenger_id,
          type: 'offer',
          title: 'Nova oferta recebida',
          body: `Oferta de R$ ${offered_price.toFixed(2)}`,
          data: { ride_id, offer_id: offer.id },
        })
      }
    } catch (notifError) {
      console.error('[v0] Error sending notification:', notifError)
    }

    return NextResponse.json({ success: true, offer })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Rate limit: 30 reads per minute
    const rlResult = apiLimiter.check(request, 30)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ride_id = searchParams.get('ride_id')

    if (!ride_id) {
      return NextResponse.json({ error: 'ride_id is required' }, { status: 400 })
    }

    // Get offers with driver and vehicle details
    const { data: offers, error } = await supabase
      .from('ride_offers')
      .select(`
        *,
        driver:drivers(
          id,
          rating,
          total_rides,
          user:users(id, full_name, avatar_url, phone)
        ),
        vehicle:vehicles(id, make, model, color, license_plate, type, photo_url)
      `)
      .eq('ride_id', ride_id)
      .in('status', ['pending', 'accepted'])
      .order('offered_price', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching offers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      offers: offers || [],
      count: offers?.length || 0
    })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
