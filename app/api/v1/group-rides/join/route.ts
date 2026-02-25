import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

// Join a group ride
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
    const { invite_code, pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address } = body

    // Get group ride
    const { data: groupRide, error: groupError } = await supabase
      .from('group_rides')
      .select('*')
      .eq('invite_code', invite_code)
      .single()

    if (groupError || !groupRide) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Check if expired
    if (new Date(groupRide.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite code expired' }, { status: 400 })
    }

    // Check if full
    if (groupRide.status === 'full') {
      return NextResponse.json({ error: 'Group ride is full' }, { status: 400 })
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('group_ride_participants')
      .select('id')
      .eq('group_ride_id', groupRide.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already joined this group ride' }, { status: 400 })
    }

    // Add participant
    const { data: participant, error: participantError } = await supabase
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
      .select()
      .single()

    if (participantError) {
      return NextResponse.json({ error: participantError.message }, { status: 500 })
    }

    return NextResponse.json({ participant, groupRide })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
