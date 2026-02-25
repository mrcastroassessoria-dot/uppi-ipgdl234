import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter } from '@/lib/utils/rate-limit'

/**
 * POST /api/v1/reviews/driver
 * Avaliação bidirecional: motorista avalia passageiro
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const { success } = await apiLimiter.check(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ride_id, passenger_id, rating, comment } = body

    // Validação
    if (!ride_id || !passenger_id || rating === undefined) {
      return NextResponse.json(
        { error: 'ride_id, passenger_id, e rating são obrigatórios' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating deve estar entre 1 e 5' },
        { status: 400 }
      )
    }

    // Verificar se o usuário é motorista da corrida
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('driver_id, passenger_id')
      .eq('id', ride_id)
      .single()

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Corrida não encontrada' }, { status: 404 })
    }

    if (ride.driver_id !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o motorista pode avaliar o passageiro' },
        { status: 403 }
      )
    }

    if (ride.passenger_id !== passenger_id) {
      return NextResponse.json(
        { error: 'passenger_id não corresponde à corrida' },
        { status: 400 }
      )
    }

    // Verificar se já avaliou
    const { data: existing } = await supabase
      .from('bidirectional_reviews')
      .select('id')
      .eq('ride_id', ride_id)
      .eq('reviewer_id', user.id)
      .eq('reviewee_id', passenger_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Você já avaliou este passageiro' },
        { status: 400 }
      )
    }

    // Criar avaliação bidirecional
    const { data: review, error: reviewError } = await supabase
      .from('bidirectional_reviews')
      .insert({
        ride_id,
        reviewer_id: user.id,
        reviewee_id: passenger_id,
        reviewer_type: 'driver',
        reviewee_type: 'passenger',
        rating,
        comment,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('[v0] Driver review insert error:', reviewError)
      return NextResponse.json({ error: reviewError.message }, { status: 400 })
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Driver review API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/v1/reviews/driver
 * Buscar avaliações de motoristas sobre passageiros
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const { success } = await apiLimiter.check(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ride_id = searchParams.get('ride_id')
    const driver_id = searchParams.get('driver_id')
    const passenger_id = searchParams.get('passenger_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('bidirectional_reviews')
      .select(`
        *,
        ride:rides(id, created_at, pickup_address, dropoff_address),
        reviewer:profiles!bidirectional_reviews_reviewer_id_fkey(id, full_name, avatar_url),
        reviewee:profiles!bidirectional_reviews_reviewee_id_fkey(id, full_name, avatar_url)
      `)
      .eq('reviewer_type', 'driver')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (ride_id) {
      query = query.eq('ride_id', ride_id)
    }

    if (driver_id) {
      query = query.eq('reviewer_id', driver_id)
    }

    if (passenger_id) {
      query = query.eq('reviewee_id', passenger_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Driver reviews fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ reviews: data || [] })
  } catch (error: any) {
    console.error('[v0] Driver reviews GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
