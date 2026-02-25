import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const offerId = params.id

    // Get the offer
    const { data: offer, error: offerError } = await supabase
      .from('price_offers')
      .select('*, ride:rides(*)')
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Check if user is the passenger of this ride
    if (offer.ride.passenger_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Accept the offer and update ride
    const { error: acceptError } = await supabase
      .from('price_offers')
      .update({ status: 'accepted' })
      .eq('id', offerId)

    if (acceptError) {
      console.error('[v0] Error accepting offer:', acceptError)
      return NextResponse.json({ error: acceptError.message }, { status: 500 })
    }

    // Reject all other offers for this ride
    await supabase
      .from('price_offers')
      .update({ status: 'rejected' })
      .eq('ride_id', offer.ride_id)
      .neq('id', offerId)

    // Update ride status and assign driver
    const { error: rideError } = await supabase
      .from('rides')
      .update({
        driver_id: offer.driver_id,
        final_price: offer.offered_price,
        status: 'accepted',
      })
      .eq('id', offer.ride_id)

    if (rideError) {
      console.error('[v0] Error updating ride:', rideError)
      return NextResponse.json({ error: rideError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
