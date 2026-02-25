import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type TableName = 
  | 'rides'
  | 'price_offers'
  | 'messages'
  | 'notifications'
  | 'driver_profiles'

export type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface RealtimeOptions {
  event?: ChangeEvent
  schema?: string
  filter?: string
}

class RealtimeService {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()

  /**
   * Subscribe to table changes
   */
  subscribeToTable<T = any>(
    table: TableName,
    callback: (payload: RealtimePostgresChangesPayload<T>) => void,
    options?: RealtimeOptions
  ): RealtimeChannel {
    const channelName = `${table}_${options?.event || 'all'}_${Date.now()}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options?.event || '*',
          schema: options?.schema || 'public',
          table: table,
          filter: options?.filter,
        },
        (payload) => {
          console.log(`[v0] Realtime event on ${table}:`, payload.eventType)
          callback(payload as RealtimePostgresChangesPayload<T>)
        }
      )
      .subscribe((status) => {
        console.log(`[v0] Realtime subscription status for ${table}:`, status)
      })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to ride updates
   */
  subscribeToRide(
    rideId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeChannel {
    return this.subscribeToTable('rides', callback, {
      filter: `id=eq.${rideId}`,
    })
  }

  /**
   * Subscribe to price offers for a ride
   */
  subscribeToPriceOffers(
    rideId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeChannel {
    return this.subscribeToTable('price_offers', callback, {
      filter: `ride_id=eq.${rideId}`,
    })
  }

  /**
   * Subscribe to messages for a ride
   */
  subscribeToMessages(
    rideId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeChannel {
    return this.subscribeToTable('messages', callback, {
      filter: `ride_id=eq.${rideId}`,
    })
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeChannel {
    return this.subscribeToTable('notifications', callback, {
      filter: `user_id=eq.${userId}`,
      event: 'INSERT',
    })
  }

  /**
   * Subscribe to driver location updates
   */
  subscribeToDriverLocation(
    driverId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeChannel {
    return this.subscribeToTable('driver_profiles', callback, {
      filter: `user_id=eq.${driverId}`,
      event: 'UPDATE',
    })
  }

  /**
   * Subscribe to nearby drivers (within a bounding box)
   */
  subscribeToNearbyDrivers(
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeChannel {
    return this.subscribeToTable('driver_profiles', callback, {
      event: 'UPDATE',
    })
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: RealtimeChannel): Promise<void> {
    const channelName = channel.topic
    await this.supabase.removeChannel(channel)
    this.channels.delete(channelName)
    console.log(`[v0] Unsubscribed from ${channelName}`)
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.channels.values()).map((channel) =>
      this.supabase.removeChannel(channel)
    )
    await Promise.all(promises)
    this.channels.clear()
    console.log('[v0] Unsubscribed from all channels')
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size
  }

  /**
   * Check if realtime is connected
   */
  isConnected(): boolean {
    return this.channels.size > 0
  }

  /**
   * Broadcast a message to a channel
   */
  async broadcast(
    channelName: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channel = this.channels.get(channelName)
    if (!channel) {
      console.warn(`[v0] Channel ${channelName} not found`)
      return
    }

    await channel.send({
      type: 'broadcast',
      event,
      payload,
    })
  }

  /**
   * Create a presence channel (for showing online users)
   */
  createPresenceChannel(
    channelName: string,
    userId: string,
    userData: any
  ): RealtimeChannel {
    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.log('[v0] Presence sync:', Object.keys(state).length, 'users')
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[v0] User joined:', key)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[v0] User left:', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userData)
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }
}

export const realtimeService = new RealtimeService()
