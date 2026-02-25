import { createClient } from './server'
import type { Driver, Ride, RideOffer, User, Vehicle } from './types'

// Helper functions for database operations

export async function findNearbyDrivers(
  pickupLat: number,
  pickupLng: number,
  radiusKm: number = 5,
  vehicleType?: string
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('find_nearby_drivers', {
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    radius_km: radiusKm,
    vehicle_type_filter: vehicleType || null
  })

  if (error) {
    console.error('[v0] Error finding nearby drivers:', error)
    throw error
  }

  return data
}

export async function calculateRidePrice(
  distanceKm: number,
  durationMinutes: number,
  vehicleType: string = 'economy'
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('calculate_ride_price', {
    distance_km: distanceKm,
    duration_minutes: durationMinutes,
    vehicle_type_param: vehicleType
  })

  if (error) {
    console.error('[v0] Error calculating ride price:', error)
    throw error
  }

  return data
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('[v0] Error fetching user:', userError)
    throw userError
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('[v0] Error fetching profile:', profileError)
  }

  return { user, profile }
}

export async function getDriverProfile(userId: string) {
  const supabase = await createClient()
  
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .select('*, vehicles(*)')
    .eq('user_id', userId)
    .single()

  if (driverError) {
    console.error('[v0] Error fetching driver:', driverError)
    throw driverError
  }

  return driver
}

export async function getRideWithDetails(rideId: string) {
  const supabase = await createClient()
  
  const { data: ride, error } = await supabase
    .from('rides')
    .select(`
      *,
      passenger:users!rides_passenger_id_fkey(*),
      driver:drivers!rides_driver_id_fkey(*, user:users(*)),
      vehicle:vehicles(*)
    `)
    .eq('id', rideId)
    .single()

  if (error) {
    console.error('[v0] Error fetching ride:', error)
    throw error
  }

  return ride
}

export async function getUserRides(userId: string, limit: number = 10) {
  const supabase = await createClient()
  
  const { data: rides, error } = await supabase
    .from('rides')
    .select(`
      *,
      driver:drivers!rides_driver_id_fkey(*, user:users(*)),
      vehicle:vehicles(*)
    `)
    .eq('passenger_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching user rides:', error)
    throw error
  }

  return rides
}

export async function getDriverRides(driverId: string, limit: number = 10) {
  const supabase = await createClient()
  
  const { data: rides, error } = await supabase
    .from('rides')
    .select(`
      *,
      passenger:users!rides_passenger_id_fkey(*),
      vehicle:vehicles(*)
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching driver rides:', error)
    throw error
  }

  return rides
}

export async function getRideOffers(rideId: string) {
  const supabase = await createClient()
  
  const { data: offers, error } = await supabase
    .from('ride_offers')
    .select(`
      *,
      driver:drivers(*, user:users(*)),
      vehicle:vehicles(*)
    `)
    .eq('ride_id', rideId)
    .order('offered_price', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching ride offers:', error)
    throw error
  }

  return offers
}

export async function getUserWalletBalance(userId: string) {
  const supabase = await createClient()
  
  const { data: transactions, error } = await supabase
    .from('wallet_transactions')
    .select('balance_after')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[v0] Error fetching wallet balance:', error)
    return 0
  }

  return transactions?.balance_after || 0
}

export async function getUserNotifications(userId: string, limit: number = 20) {
  const supabase = await createClient()
  
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching notifications:', error)
    throw error
  }

  return notifications
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    console.error('[v0] Error marking notification as read:', error)
    throw error
  }
}

export async function getUserFavorites(userId: string) {
  const supabase = await createClient()
  
  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching favorites:', error)
    throw error
  }

  return favorites
}

export async function getActiveCoupons() {
  const supabase = await createClient()
  
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .gte('valid_until', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching coupons:', error)
    throw error
  }

  return coupons
}

export async function validateCoupon(code: string, userId: string) {
  const supabase = await createClient()
  
  // Check if coupon exists and is active
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (couponError) {
    console.error('[v0] Coupon not found:', couponError)
    return { valid: false, message: 'Cupom inválido' }
  }

  // Check expiry
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return { valid: false, message: 'Cupom expirado' }
  }

  // Check usage limit
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, message: 'Cupom esgotado' }
  }

  // Check user usage
  const { data: userUsage, error: usageError } = await supabase
    .from('coupon_usage')
    .select('*')
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId)

  if (usageError) {
    console.error('[v0] Error checking coupon usage:', usageError)
  }

  if (userUsage && userUsage.length >= coupon.user_usage_limit) {
    return { valid: false, message: 'Você já usou este cupom' }
  }

  return { valid: true, coupon }
}

export async function getUserAchievements(userId: string) {
  const supabase = await createClient()
  
  const { data: achievements, error } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievements(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching achievements:', error)
    throw error
  }

  return achievements
}

export async function getLeaderboard(period: 'weekly' | 'monthly' | 'all_time' = 'weekly', limit: number = 10) {
  const supabase = await createClient()
  
  const { data: leaderboard, error } = await supabase
    .from('leaderboard')
    .select('*, user:users(*)')
    .eq('period', period)
    .order('rank', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching leaderboard:', error)
    throw error
  }

  return leaderboard
}

export async function getSocialPosts(limit: number = 20) {
  const supabase = await createClient()
  
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select('*, user:users(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching social posts:', error)
    throw error
  }

  return posts
}
