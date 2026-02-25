'use client'

import { createClient } from '@/lib/supabase/client'
import type { Ride, VehicleType, PaymentMethod } from '@/lib/types/database'

export interface CreateRideParams {
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  distance_km: number
  estimated_duration_minutes: number
  passenger_price_offer: number
  payment_method: PaymentMethod
  vehicle_type: VehicleType
  notes?: string
  stops?: Array<{
    address: string
    lat: number
    lng: number
    order: number
  }>
}

export interface RideServiceResult {
  success: boolean
  ride?: Ride
  error?: string
}

/**
 * Sistema de Negociação de Preços - Uppi
 * Leilão reverso onde passageiro faz oferta e motoristas contra-ofertam
 */
export class RideService {
  private supabase = createClient()

  /**
   * Cria uma solicitação de corrida e notifica motoristas próximos
   */
  async createRideRequest(params: CreateRideParams): Promise<RideServiceResult> {
    console.log('[v0] Creating ride request with negotiation...', params)

    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // 1. Criar corrida com status 'negotiating'
      const { data: ride, error: rideError } = await this.supabase
        .from('rides')
        .insert({
          passenger_id: user.id,
          pickup_address: params.pickup_address,
          pickup_lat: params.pickup_lat,
          pickup_lng: params.pickup_lng,
          dropoff_address: params.dropoff_address,
          dropoff_lat: params.dropoff_lat,
          dropoff_lng: params.dropoff_lng,
          distance_km: params.distance_km,
          estimated_duration_minutes: params.estimated_duration_minutes,
          passenger_price_offer: params.passenger_price_offer,
          payment_method: params.payment_method,
          vehicle_type: params.vehicle_type,
          notes: params.notes,
          status: 'negotiating', // Estado de negociação ativo
        })
        .select()
        .single()

      if (rideError || !ride) {
        console.error('[v0] Error creating ride:', rideError)
        return { success: false, error: 'Erro ao criar solicitação' }
      }

      console.log('[v0] Ride created successfully:', ride.id)

      // 2. Buscar motoristas próximos (usando função PostGIS)
      const nearbyDrivers = await this.findNearbyDrivers(
        params.pickup_lat,
        params.pickup_lng,
        params.vehicle_type
      )

      console.log('[v0] Found nearby drivers:', nearbyDrivers.length)

      // 3. Criar notificações para motoristas próximos
      if (nearbyDrivers.length > 0) {
        await this.notifyDrivers(ride, nearbyDrivers)
      }

      return { success: true, ride }
    } catch (error) {
      console.error('[v0] Ride service error:', error)
      return { success: false, error: 'Erro inesperado' }
    }
  }

  /**
   * Busca motoristas disponíveis próximos usando PostGIS
   */
  private async findNearbyDrivers(
    lat: number,
    lng: number,
    vehicleType: VehicleType,
    radiusKm: number = 5
  ) {
    try {
      const { data, error } = await this.supabase.rpc('get_nearby_drivers', {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: radiusKm,
        p_vehicle_type: vehicleType,
      })

      if (error) {
        console.error('[v0] Error finding nearby drivers:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[v0] Error in findNearbyDrivers:', error)
      return []
    }
  }

  /**
   * Notifica motoristas sobre nova solicitação de corrida
   */
  private async notifyDrivers(ride: Ride, driverIds: string[]) {
    console.log('[v0] Notifying drivers:', driverIds)

    const notifications = driverIds.map((driverId) => ({
      user_id: driverId,
      title: 'Nova solicitação de corrida',
      message: `Nova corrida de ${ride.pickup_address} para ${ride.dropoff_address}. Oferta: R$ ${ride.passenger_price_offer?.toFixed(2)}`,
      type: 'new_ride_request',
      data: {
        ride_id: ride.id,
        pickup_address: ride.pickup_address,
        dropoff_address: ride.dropoff_address,
        passenger_offer: ride.passenger_price_offer,
        distance_km: ride.distance_km,
        estimated_duration: ride.estimated_duration_minutes,
      },
      read: false,
    }))

    const { error } = await this.supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('[v0] Error creating notifications:', error)
    } else {
      console.log('[v0] Notifications created successfully')
    }
  }

  /**
   * Motorista faz uma oferta (contra-oferta)
   */
  async createDriverOffer(
    rideId: string,
    offeredPrice: number,
    message?: string
  ): Promise<RideServiceResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Verificar se motorista já fez oferta
      const { data: existingOffer } = await this.supabase
        .from('price_offers')
        .select('id')
        .eq('ride_id', rideId)
        .eq('driver_id', user.id)
        .single()

      if (existingOffer) {
        return { success: false, error: 'Você já fez uma oferta para esta corrida' }
      }

      // Criar oferta (expira em 2 minutos)
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 2)

      const { data: offer, error } = await this.supabase
        .from('price_offers')
        .insert({
          ride_id: rideId,
          driver_id: user.id,
          offered_price: offeredPrice,
          message,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Error creating offer:', error)
        return { success: false, error: 'Erro ao criar oferta' }
      }

      // Notificar passageiro
      const { data: ride } = await this.supabase
        .from('rides')
        .select('passenger_id')
        .eq('id', rideId)
        .single()

      if (ride) {
        await this.supabase.from('notifications').insert({
          user_id: ride.passenger_id,
          title: 'Nova oferta recebida!',
          message: `Um motorista ofereceu R$ ${offeredPrice.toFixed(2)} para sua corrida`,
          type: 'new_offer',
          data: {
            ride_id: rideId,
            offer_id: offer.id,
            offered_price: offeredPrice,
          },
          read: false,
        })
      }

      return { success: true }
    } catch (error) {
      console.error('[v0] Error creating offer:', error)
      return { success: false, error: 'Erro inesperado' }
    }
  }

  /**
   * Passageiro aceita uma oferta
   */
  async acceptOffer(offerId: string): Promise<RideServiceResult> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      // Buscar oferta com informações da corrida
      const { data: offer } = await this.supabase
        .from('price_offers')
        .select('*, rides(*)')
        .eq('id', offerId)
        .single()

      if (!offer) {
        return { success: false, error: 'Oferta não encontrada' }
      }

      // Verificar se é o passageiro da corrida
      if ((offer.rides as any).passenger_id !== user.id) {
        return { success: false, error: 'Você não tem permissão para aceitar esta oferta' }
      }

      // Atualizar oferta como aceita
      await this.supabase
        .from('price_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId)

      // Rejeitar outras ofertas
      await this.supabase
        .from('price_offers')
        .update({ status: 'rejected' })
        .eq('ride_id', offer.ride_id)
        .neq('id', offerId)

      // Atualizar corrida com motorista e preço final
      const { data: updatedRide, error: updateError } = await this.supabase
        .from('rides')
        .update({
          driver_id: offer.driver_id,
          final_price: offer.offered_price,
          status: 'accepted',
        })
        .eq('id', offer.ride_id)
        .select()
        .single()

      if (updateError) {
        console.error('[v0] Error updating ride:', updateError)
        return { success: false, error: 'Erro ao aceitar oferta' }
      }

      // Notificar motorista
      await this.supabase.from('notifications').insert({
        user_id: offer.driver_id,
        title: 'Oferta aceita!',
        message: `Sua oferta de R$ ${offer.offered_price.toFixed(2)} foi aceita!`,
        type: 'offer_accepted',
        data: {
          ride_id: offer.ride_id,
          offer_id: offerId,
        },
        read: false,
      })

      return { success: true, ride: updatedRide }
    } catch (error) {
      console.error('[v0] Error accepting offer:', error)
      return { success: false, error: 'Erro inesperado' }
    }
  }

  /**
   * Subscribe to real-time offers for a ride
   */
  subscribeToOffers(
    rideId: string,
    onNewOffer: (offer: any) => void,
    onOfferUpdated: (offer: any) => void
  ) {
    const channel = this.supabase
      .channel(`ride-offers-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'price_offers',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          console.log('[v0] New offer received:', payload.new)
          onNewOffer(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'price_offers',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          console.log('[v0] Offer updated:', payload.new)
          onOfferUpdated(payload.new)
        }
      )
      .subscribe()

    return () => {
      this.supabase.removeChannel(channel)
    }
  }
}

export const rideService = new RideService()
