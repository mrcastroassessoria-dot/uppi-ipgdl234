import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ride_id = searchParams.get('ride_id')

    if (!ride_id) {
      return NextResponse.json({ error: 'ride_id is required' }, { status: 400 })
    }

    // Verify user is part of this ride
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('passenger_id, driver_id')
      .eq('id', ride_id)
      .single()

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    if (ride.passenger_id !== user.id && ride.driver_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url)
      `)
      .eq('ride_id', ride_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[v0] Messages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ride_id, message } = body

    if (!ride_id || !message) {
      return NextResponse.json({ error: 'ride_id and message are required' }, { status: 400 })
    }

    // Verify user is part of this ride
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('passenger_id, driver_id')
      .eq('id', ride_id)
      .single()

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    if (ride.passenger_id !== user.id && ride.driver_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create message
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        ride_id,
        sender_id: user.id,
        message,
      })
      .select(`
        *,
        sender:profiles!sender_id(id, full_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('[v0] Messages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
