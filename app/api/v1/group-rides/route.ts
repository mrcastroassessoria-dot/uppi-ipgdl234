import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

// Create a new group ride
export async function POST(request: Request) {
  try {
    const rlResult = apiLimiter.check(request, 10)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ride_id, max_passengers, split_method, pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address } = body

    // Generate invite code
    const { data: codeData, error: codeError } = await supabase.rpc('generate_invite_code')
    
    if (codeError) {
      return NextResponse.json({ error: 'Failed to generate invite code' }, { status: 500 })
    }

    // Create group ride
    const { data: groupRide, error: createError } = await supabase
      .from('group_rides')
      .insert({
        ride_id,
        created_by: user.id,
        invite_code: codeData,
        max_passengers: max_passengers || 4,
        split_method: split_method || 'equal',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Add creator as first participant
    const { error: participantError } = await supabase
      .from('group_ride_participants')
      .insert({
        group_ride_id: groupRide.id,
        user_id: user.id,
        status: 'accepted',
        pickup_lat,
        pickup_lng,
        pickup_address,
        dropoff_lat,
        dropoff_lng,
        dropoff_address,
      })

    if (participantError) {
      return NextResponse.json({ error: participantError.message }, { status: 500 })
    }

    return NextResponse.json({ groupRide })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get group rides
export async function GET(request: Request) {
  try {
    const rlResult = apiLimiter.check(request, 30)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inviteCode = searchParams.get('invite_code')

    if (inviteCode) {
      // Get specific group ride by invite code
      const { data: groupRide, error } = await supabase
        .from('group_rides')
        .select(`
          *,
          participants:group_ride_participants(
            *,
            user:profiles(full_name, avatar_url)
          )
        `)
        .eq('invite_code', inviteCode)
        .single()

      if (error) {
        return NextResponse.json({ error: 'Group ride not found' }, { status: 404 })
      }

      return NextResponse.json({ groupRide })
    }

    // Get user's group rides
    const { data: groupRides, error } = await supabase
      .from('group_rides')
      .select(`
        *,
        participants:group_ride_participants(
          *,
          user:profiles(full_name, avatar_url)
        )
      `)
      .or(`created_by.eq.${user.id},id.in.(SELECT group_ride_id FROM group_ride_participants WHERE user_id = '${user.id}')`)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ groupRides })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
