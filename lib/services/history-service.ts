import { createClient } from '@/lib/supabase/client'
import type { Ride } from '@/lib/types/database'

export const historyService = {
  async getRideHistory(userId: string, limit = 20, offset = 0) {
    const supabase = createClient()
    
    const { data, error, count } = await supabase
      .from('rides')
      .select(`
        *,
        driver:driver_profiles!rides_driver_id_fkey(id, rating, vehicle_type, vehicle_model, license_plate),
        passenger:profiles!rides_passenger_id_fkey(id, full_name, avatar_url)
      `, { count: 'exact' })
      .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[v0] Error fetching ride history:', error)
      return { success: false, error: error.message }
    }

    return { 
      success: true, 
      rides: data as Ride[], 
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }
  },

  async getRideDetails(rideId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        driver:driver_profiles!rides_driver_id_fkey(*),
        passenger:profiles!rides_passenger_id_fkey(*),
        rating:ratings(*)
      `)
      .eq('id', rideId)
      .single()

    if (error) {
      console.error('[v0] Error fetching ride details:', error)
      return { success: false, error: error.message }
    }

    return { success: true, ride: data }
  },

  async getFavoriteLocations(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching favorites:', error)
      return { success: false, error: error.message }
    }

    return { success: true, favorites: data }
  },

  async addFavoriteLocation(userId: string, address: string, lat: number, lng: number, label?: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        address,
        lat,
        lng,
        label,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error adding favorite:', error)
      return { success: false, error: error.message }
    }

    return { success: true, favorite: data }
  },

  async removeFavoriteLocation(favoriteId: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)

    if (error) {
      console.error('[v0] Error removing favorite:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  },

  async getFrequentDestinations(userId: string, limit = 5) {
    const supabase = createClient()
    
    // Get most frequent destinations from completed rides
    const { data, error } = await supabase
      .rpc('get_frequent_destinations', {
        p_user_id: userId,
        p_limit: limit
      })

    if (error) {
      console.error('[v0] Error fetching frequent destinations:', error)
      return { success: false, error: error.message }
    }

    return { success: true, destinations: data }
  }
}
