'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { realtimeService } from '@/lib/services/realtime-service'
import { iosToast } from '@/lib/utils/ios-toast'
import { triggerHaptic } from '@/hooks/use-haptic'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, DollarSign, Clock, Navigation, X } from 'lucide-react'

interface Ride {
  id: string
  passenger_id: string
  pickup_address: string
  dropoff_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
  distance_km: number
  estimated_duration_minutes: number
  passenger_price_offer: number
  payment_method: string
  vehicle_type: string
  status: string
  created_at: string
  passenger?: {
    full_name: string
    avatar_url: string | null
    rating: number
  }
}

export default function DriverActivePage() {
  const router = useRouter()
  const supabase = createClient()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [selectedRide, setSelectedRide] = useState<string | null>(null)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerMessage, setOfferMessage] = useState('')

  const fetchPendingRides = useCallback(async () => {
    const { data } = await supabase
      .from('rides')
      .select(`
        *,
        passenger:profiles!rides_passenger_id_fkey(full_name, avatar_url, rating)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setRides(data as Ride[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPendingRides()

    console.log('[v0] Setting up driver-mode realtime subscription')

    // Subscribe to new pending rides
    const ridesChannel = realtimeService.subscribeToTable(
      'rides',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRide = payload.new as any
          if (newRide.status === 'pending') {
            console.log('[v0] New pending ride for driver:', newRide.id)
            triggerHaptic('notification')
            iosToast.success('Nova corrida disponível!')
            fetchPendingRides()
          }
        }
      },
      'status=eq.pending'
    )

    return () => {
      console.log('[v0] Cleaning up driver-mode subscription')
      realtimeService.unsubscribe(ridesChannel)
    }
  }, [fetchPendingRides])

  const handleMakeOffer = async (rideId: string) => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      iosToast.error('Digite um valor válido')
      triggerHaptic('error')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('ride_offers')
        .insert({
          ride_id: rideId,
          driver_id: user.id,
          offered_price: parseFloat(offerPrice),
          message: offerMessage || null,
          status: 'pending'
        })

      if (error) throw error

      triggerHaptic('success')
      iosToast.success('Oferta enviada!')
      setSelectedRide(null)
      setOfferPrice('')
      setOfferMessage('')
      fetchPendingRides()
    } catch (error) {
      console.error('[v0] Error making offer:', error)
      triggerHaptic('error')
      iosToast.error('Erro ao enviar oferta')
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <div className="min-h-dvh bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Button
              variant={isOnline ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                setIsOnline(!isOnline)
                triggerHaptic('selection')
                iosToast.success(isOnline ? 'Você está offline' : 'Você está online')
              }}
            >
              {isOnline ? 'Ficar Offline' : 'Ficar Online'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Corridas Disponíveis</h1>
          <p className="text-sm text-muted-foreground">
            {rides.length} corrida{rides.length !== 1 ? 's' : ''} aguardando motorista
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : rides.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma corrida disponível no momento</p>
          </Card>
        ) : (
          rides.map((ride) => (
            <Card key={ride.id} className="p-4 space-y-4">
              {/* Passenger info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {ride.passenger?.avatar_url ? (
                    <img src={ride.passenger.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-sm font-semibold">{ride.passenger?.full_name?.[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{ride.passenger?.full_name || 'Passageiro'}</p>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-3 h-3 ${star <= (ride.passenger?.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ride.passenger?.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary">{ride.vehicle_type}</Badge>
              </div>

              {/* Route */}
              <div className="space-y-2">
                <div className="flex gap-3">
                  <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Origem</p>
                    <p className="text-sm text-muted-foreground">{ride.pickup_address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Destino</p>
                    <p className="text-sm text-muted-foreground">{ride.dropoff_address}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                  <span>{ride.distance_km.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{ride.estimated_duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">R$ {ride.passenger_price_offer.toFixed(2)}</span>
                </div>
                <Badge variant="outline" className="ml-auto">{ride.payment_method}</Badge>
              </div>

              {/* Offer form */}
              {selectedRide === ride.id ? (
                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <label className="text-sm font-medium">Seu preço</label>
                    <input
                      type="number"
                      step="0.01"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mensagem (opcional)</label>
                    <textarea
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="Chego em 5 minutos..."
                      rows={2}
                      className="w-full mt-1 px-3 py-2 border rounded-lg resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRide(null)
                        setOfferPrice('')
                        setOfferMessage('')
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleMakeOffer(ride.id)}
                    >
                      Enviar Oferta
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedRide(ride.id)
                    setOfferPrice(ride.passenger_price_offer.toString())
                    triggerHaptic('selection')
                  }}
                >
                  Fazer Oferta
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
