import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ride statistics
    const { data: ridesAsPassenger, error: passengerError } = await supabase
      .from('rides')
      .select('id, status, price, created_at')
      .eq('passenger_id', user.id)

    if (passengerError) throw passengerError

    const { data: ridesAsDriver, error: driverError } = await supabase
      .from('rides')
      .select('id, status, price, created_at')
      .eq('driver_id', user.id)

    if (driverError) throw driverError

    // Calculate statistics
    const totalRides = (ridesAsPassenger?.length || 0) + (ridesAsDriver?.length || 0)
    const completedRides = [
      ...(ridesAsPassenger || []),
      ...(ridesAsDriver || []),
    ].filter(r => r.status === 'completed').length

    const totalSpent = ridesAsPassenger
      ?.filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.price || 0), 0) || 0

    const totalEarned = ridesAsDriver
      ?.filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.price || 0), 0) || 0

    // Get ratings
    const { data: ratingsReceived, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('rated_user_id', user.id)

    if (ratingsError) throw ratingsError

    const averageRating = ratingsReceived && ratingsReceived.length > 0
      ? ratingsReceived.reduce((sum, r) => sum + r.rating, 0) / ratingsReceived.length
      : 0

    // Get wallet balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    return NextResponse.json({
      stats: {
        totalRides,
        completedRides,
        totalSpent,
        totalEarned,
        averageRating: averageRating.toFixed(1),
        walletBalance: profile?.wallet_balance || 0,
        ridesThisMonth: ridesAsPassenger?.filter(r => {
          const rideDate = new Date(r.created_at)
          const now = new Date()
          return rideDate.getMonth() === now.getMonth() && 
                 rideDate.getFullYear() === now.getFullYear()
        }).length || 0,
      }
    })
  } catch (error) {
    console.error('[v0] Stats GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
