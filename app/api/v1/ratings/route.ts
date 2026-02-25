import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ride_id, rating, comment, reviewed_id, tags } = body

    // Verificar se a corrida existe e pertence ao usuário
    const { data: ride } = await supabase
      .from('rides')
      .select('*')
      .eq('id', ride_id)
      .single()

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    // Verificar se o usuário participou da corrida
    if (ride.passenger_id !== user.id && ride.driver_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Criar avaliação
    const { data: newRating, error } = await supabase
      .from('ratings')
      .insert({
        ride_id,
        rating,
        comment,
        reviewer_id: user.id,
        reviewed_id,
        tags: tags || [],
      })
      .select()
      .single()

    if (error) throw error

    // Atualizar média de avaliação do usuário avaliado
    const { data: ratings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('reviewed_id', reviewed_id)

    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

      await supabase
        .from('profiles')
        .update({ rating: avgRating.toFixed(2), total_rides: ratings.length })
        .eq('id', reviewed_id)
    }

    return NextResponse.json({ rating: newRating })
  } catch (error) {
    console.error('[v0] Error creating rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, full_name, avatar_url),
        ride:rides(id, pickup_address, dropoff_address, created_at)
      `)
      .eq('reviewed_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error('[v0] Error fetching ratings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
