import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rideRequestSchema } from '@/lib/validations/schemas'
import { successResponse, errorResponse, requireAuth, handleApiError } from '@/lib/api-utils'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    // Validate request body
    const validation = rideRequestSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse('Dados inválidos: ' + validation.error.errors[0].message)
    }

    const data = validation.data
    const supabase = await createClient()

    // Map vehicle type from request to DB enum (economy, comfort, premium, suv, van, moto)
    const vehicleTypeMap: Record<string, string> = {
      'car': 'economy',
      'moto': 'moto',
      'van': 'van',
    }

    // Create ride with correct schema
    const { data: ride, error } = await supabase
      .from('rides')
      .insert({
        passenger_id: user.id,
        pickup_address: data.pickup_address,
        pickup_lat: data.pickup_lat,
        pickup_lng: data.pickup_lng,
        dropoff_address: data.dropoff_address,
        dropoff_lat: data.dropoff_lat,
        dropoff_lng: data.dropoff_lng,
        status: 'searching',
        type: 'individual',
        payment_method: data.payment_method || 'pix',
        estimated_price: data.passenger_price_offer,
        notes: data.notes,
        is_shared: false,
        max_passengers: 1,
        current_passengers: 1,
        discount_amount: 0,
      })
      .select(`
        *,
        passenger:users!rides_passenger_id_fkey(id, full_name, avatar_url, phone)
      `)
      .single()

    if (error) {
      console.error('[v0] Error creating ride:', error)
      return errorResponse('Erro ao criar corrida: ' + error.message, 500)
    }

    // After creating ride, notify nearby drivers
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ride',
          title: 'Nova corrida disponível',
          body: `De ${data.pickup_address} para ${data.dropoff_address}`,
          ride_id: ride.id,
        }),
      })
    } catch (notifError) {
      console.error('[v0] Error sending notifications:', notifError)
    }

    return successResponse(ride, 'Corrida criada com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createClient()

    let query = supabase
      .from('rides')
      .select(`
        *,
        driver:drivers!rides_driver_id_fkey(
          id,
          rating,
          total_rides,
          user:users(id, full_name, avatar_url, phone)
        ),
        vehicle:vehicles(id, make, model, color, license_plate, type)
      `)
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: rides, error } = await query

    if (error) {
      console.error('[v0] Error fetching rides:', error)
      return errorResponse('Erro ao buscar corridas: ' + error.message, 500)
    }

    return successResponse(rides)
  } catch (error) {
    return handleApiError(error)
  }
}
