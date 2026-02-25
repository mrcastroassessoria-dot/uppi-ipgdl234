'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { realtimeService } from '@/lib/services/realtime-service'
import type { Ride } from '@/lib/types/database'
import { triggerHaptic } from '@/hooks/use-haptic'

interface DriverInfo {
  id: string
  full_name: string
  avatar_url: string | null
  rating: number
  total_rides: number
  driver_profile: {
    vehicle_type: string
    vehicle_brand: string
    vehicle_model: string
    vehicle_color: string
    vehicle_plate: string
    current_location?: { type: string; coordinates: [number, number] }
  }[]
}

interface OfferWithDriver {
  id: string
  ride_id: string
  driver_id: string
  offered_price: number
  message: string | null
  status: string
  created_at: string
  expires_at: string
  driver?: DriverInfo
  estimatedMinutes?: number
  timeRemaining?: number
}

// --- Utility functions ---

function estimateArrivalMinutes(
  driverLat?: number,
  driverLng?: number,
  pickupLat?: number,
  pickupLng?: number
): number | null {
  if (!driverLat || !driverLng || !pickupLat || !pickupLng) return null
  const R = 6371
  const dLat = ((pickupLat - driverLat) * Math.PI) / 180
  const dLon = ((pickupLng - driverLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((driverLat * Math.PI) / 180) *
      Math.cos((pickupLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distKm = R * c
  const avgSpeedKmh = 30
  return Math.max(1, Math.round((distKm / avgSpeedKmh) * 60))
}

function getVehicleColorDot(color: string) {
  const colorMap: Record<string, string> = {
    preto: 'bg-neutral-900', preta: 'bg-neutral-900',
    branco: 'bg-white border border-neutral-300', branca: 'bg-white border border-neutral-300',
    prata: 'bg-neutral-400', cinza: 'bg-neutral-500',
    vermelho: 'bg-red-500', vermelha: 'bg-red-500',
    azul: 'bg-blue-500',
    verde: 'bg-green-500',
    amarelo: 'bg-yellow-400', amarela: 'bg-yellow-400',
  }
  const lower = color?.toLowerCase() || ''
  for (const [key, value] of Object.entries(colorMap)) {
    if (lower.includes(key)) return value
  }
  return 'bg-neutral-400'
}

// --- Sub-components ---

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 fill-neutral-200'}`}
          viewBox="0 0 20 20"
        >
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  )
}

function VehicleIcon({ type, className = 'w-5 h-5' }: { type: string; className?: string }) {
  if (type === 'moto') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="5" cy="17" r="3" />
        <circle cx="19" cy="17" r="3" />
        <path d="M5 14l4-7h6l4 7" />
        <path d="M9 7l1-3h4l1 3" />
      </svg>
    )
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zM16 17a2 2 0 104 0 2 2 0 00-4 0zM4 11l2-5h12l2 5M4 11h16M4 11v6h16v-6" />
    </svg>
  )
}

/** Circular countdown ring with progress */
function CountdownRing({ seconds, totalSeconds = 120 }: { seconds: number; totalSeconds?: number }) {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, seconds / totalSeconds)
  const offset = circumference * (1 - progress)
  const isUrgent = seconds <= 30
  const isCritical = seconds <= 15
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-9 h-9">
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r={radius} fill="none" stroke="currentColor" strokeWidth={3}
            className="text-neutral-200/60" />
          <circle cx="20" cy="20" r={radius} fill="none" strokeWidth={3}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${
              isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-emerald-500'
            }`}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className={`w-3.5 h-3.5 ${
            isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-emerald-500'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <span className={`text-[13px] font-bold tabular-nums ${
        isCritical ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-neutral-500'
      } ${isCritical ? 'animate-pulse' : ''}`}>
        {minutes}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  )
}

/** New offer arrival toast notification */
function NewOfferToast({ driverName, price, show }: { driverName: string; price: number; show: boolean }) {
  if (!show) return null
  return (
    <div className="absolute top-0 left-0 right-0 z-50 px-5 pt-2 animate-ios-fade-up">
      <div className="bg-neutral-900/95 ios-blur rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 animate-bell-shake">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white truncate">Nova oferta de {driverName}</p>
          <p className="text-[12px] text-neutral-400">R$ {price.toFixed(2)}</p>
        </div>
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

/** Savings summary banner */
function SavingsBanner({ averageSavings, offerCount }: { averageSavings: number; offerCount: number }) {
  if (averageSavings <= 0) return null
  return (
    <div className="px-5 pt-3 pb-1">
      <div className="bg-emerald-500 rounded-2xl p-4 animate-savings-glow animate-ios-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-[14px] flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Economia media</p>
            <p className="text-[22px] font-extrabold text-white tracking-tight leading-tight">
              R$ {averageSavings.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-full px-3 py-1.5">
              <p className="text-[12px] font-bold text-white">{offerCount} {offerCount === 1 ? 'oferta' : 'ofertas'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Waiting for drivers empty state */
function WaitingState({ vehicleType }: { vehicleType: string }) {
  const isMoto = vehicleType === 'moto'
  return (
    <div className="flex flex-col items-center justify-center h-full animate-ios-fade-up">
      <div className="relative mb-6">
        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center animate-ios-pulse">
          <VehicleIcon type={vehicleType} className="w-14 h-14 text-blue-500" />
        </div>
        {/* Radar rings */}
        <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute -inset-4 rounded-full border border-blue-100 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
      </div>
      <h2 className="text-[22px] font-bold text-neutral-900 tracking-tight mb-2 text-balance text-center">
        Procurando {isMoto ? 'motoboys' : 'motoristas'}...
      </h2>
      <p className="text-[15px] text-neutral-500 text-center leading-relaxed max-w-[280px]">
        Aguarde enquanto {isMoto ? 'motoboys' : 'motoristas'} proximos analisam sua solicitacao
      </p>
      <div className="flex items-center gap-1.5 mt-6 bg-blue-50 rounded-full px-4 py-2">
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-[12px] font-semibold text-blue-600 ml-1.5">Buscando ativamente</span>
      </div>
    </div>
  )
}

/** Individual offer card */
function OfferCard({
  offer,
  ride,
  isBest,
  isAccepting,
  onAccept,
  animationDelay,
}: {
  offer: OfferWithDriver
  ride: Ride | null
  isBest: boolean
  isAccepting: boolean
  onAccept: () => void
  animationDelay: number
}) {
  const driver = offer.driver
  const dp = driver?.driver_profile?.[0]
  const priceDiff = (offer.offered_price || 0) - (ride?.passenger_price_offer || 0)
  const savingsPercent = ride?.passenger_price_offer
    ? Math.round(((ride.passenger_price_offer - offer.offered_price) / ride.passenger_price_offer) * 100)
    : 0

  return (
    <div
      className={`ios-card-elevated p-0 overflow-hidden animate-offer-entrance relative ${
        isBest ? 'ring-2 ring-amber-400 animate-best-ring' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Best offer crown badge */}
      {isBest && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-amber-500 pl-2 pr-3 py-1 rounded-b-xl shadow-lg">
          <svg className="w-4 h-4 text-white animate-crown-float" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
            <path d="M5 19h14a1 1 0 001-1H4a1 1 0 001 1z" />
          </svg>
          <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">Melhor oferta</span>
        </div>
      )}

      {/* Top bar: arrival + countdown */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${
        isBest ? 'bg-amber-50 pt-6' : 'bg-neutral-50'
      }`}>
        <div className="flex items-center gap-2">
          {offer.estimatedMinutes && offer.estimatedMinutes <= 3 ? (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Perto
            </span>
          ) : null}
          <span className="text-[13px] font-semibold text-neutral-500">
            {offer.estimatedMinutes
              ? offer.estimatedMinutes <= 1
                ? 'Menos de 1 min'
                : `${offer.estimatedMinutes} min ate voce`
              : ''}
          </span>
        </div>
        {offer.timeRemaining != null && offer.timeRemaining > 0 && (
          <CountdownRing seconds={offer.timeRemaining} />
        )}
      </div>

      <div className="p-4 pt-3">
        {/* Driver row */}
        <div className="flex items-center gap-3.5 mb-3.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-[52px] h-[52px] rounded-2xl overflow-hidden bg-neutral-100 shadow-md">
              {driver?.avatar_url ? (
                <img
                  src={driver.avatar_url || "/placeholder.svg"}
                  alt={driver.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                  <span className="text-[20px] font-bold text-blue-600">
                    {driver?.full_name?.[0] || 'M'}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2px] border-white" />
          </div>

          {/* Name + stats */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-neutral-900 truncate">
              {driver?.full_name || 'Motorista'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={driver?.rating || 5} />
              <span className="text-[12px] font-semibold text-neutral-500">
                {(driver?.rating || 5).toFixed(1)}
              </span>
              <span className="text-neutral-200">|</span>
              <span className="text-[11px] text-neutral-400">
                {driver?.total_rides || 0} corridas
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            <p className="text-[26px] font-extrabold text-neutral-900 tracking-tighter leading-none">
              <span className="text-[14px] font-bold text-neutral-400 mr-0.5">R$</span>
              {offer.offered_price.toFixed(2)}
            </p>
            {priceDiff < 0 && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-[12px] font-bold text-emerald-600">
                  {savingsPercent > 0 ? `-${savingsPercent}%` : `-R$${Math.abs(priceDiff).toFixed(2)}`}
                </span>
              </div>
            )}
            {priceDiff > 0 && (
              <p className="text-[11px] font-semibold text-red-500 mt-0.5">
                +R$ {priceDiff.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Vehicle info */}
        <div className="bg-neutral-50 rounded-2xl p-3 mb-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-neutral-100">
            <VehicleIcon type={dp?.vehicle_type || 'economy'} className="w-4.5 h-4.5 text-neutral-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-neutral-900 truncate">
              {dp?.vehicle_brand} {dp?.vehicle_model}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2.5 h-2.5 rounded-full ${getVehicleColorDot(dp?.vehicle_color || '')}`} />
              <span className="text-[12px] text-neutral-500 capitalize">{dp?.vehicle_color}</span>
              <span className="text-neutral-200">|</span>
              <span className="text-[12px] text-neutral-500 font-mono tracking-wider uppercase">
                {dp?.vehicle_plate}
              </span>
            </div>
          </div>
        </div>

        {/* Driver message */}
        {offer.message && (
          <div className="bg-blue-50 rounded-xl px-3.5 py-2.5 mb-3.5 flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-[13px] text-blue-700 italic leading-relaxed">
              {`"${offer.message}"`}
            </p>
          </div>
        )}

        {/* Accept button */}
        <button
          type="button"
          disabled={isAccepting}
          onClick={onAccept}
          className={`w-full h-[50px] rounded-[14px] text-white text-[16px] font-bold ios-press shadow-lg transition-all flex items-center justify-center gap-2 ${
            isBest
              ? 'bg-amber-500 shadow-amber-500/25'
              : 'bg-emerald-500 shadow-emerald-500/25'
          } disabled:opacity-60`}
        >
          {isAccepting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {isBest ? 'Aceitar melhor oferta' : 'Aceitar motorista'}
              {isBest && (
                <svg className="w-4 h-4 animate-swipe-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// --- Main page ---

export default function RideOffersPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [ride, setRide] = useState<Ride | null>(null)
  const [offers, setOffers] = useState<OfferWithDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [averageSavings, setAverageSavings] = useState(0)
  const [bestOffer, setBestOffer] = useState<string | null>(null)
  const [newOfferToast, setNewOfferToast] = useState<{ name: string; price: number } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const prevOfferCount = useRef(0)

  // Countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setOffers(current =>
        current
          .map(offer => ({
            ...offer,
            timeRemaining: Math.max(0, Math.floor((new Date(offer.expires_at).getTime() - Date.now()) / 1000)),
          }))
          .filter(offer => (offer.timeRemaining ?? 0) > 0)
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchOffers = useCallback(async (rideData?: Ride | null): Promise<OfferWithDriver[]> => {
    const rd = rideData || ride
    const { data } = await supabase
      .from('price_offers')
      .select(`
        *,
        driver:profiles!driver_id (
          id, full_name, avatar_url, rating, total_rides,
          driver_profile:driver_profiles ( vehicle_type, vehicle_brand, vehicle_model, vehicle_color, vehicle_plate, current_location )
        )
      `)
      .eq('ride_id', params.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    const offersWithTime = (data || []).map((o: any) => {
      const dp = o.driver?.driver_profile?.[0]
      const loc = dp?.current_location?.coordinates
      const est = estimateArrivalMinutes(loc?.[1], loc?.[0], rd?.pickup_lat, rd?.pickup_lng)
      const timeRemaining = Math.max(0, Math.floor((new Date(o.expires_at).getTime() - Date.now()) / 1000))
      return {
        ...o,
        estimatedMinutes: est ?? Math.floor(Math.random() * 12) + 2,
        timeRemaining,
      }
    }).filter(o => o.timeRemaining > 0)

    // Calculate savings and best offer
    if (offersWithTime.length > 0 && rd?.passenger_price_offer) {
      const savings = offersWithTime
        .map(o => rd.passenger_price_offer! - o.offered_price)
        .filter(s => s > 0)

      if (savings.length > 0) {
        setAverageSavings(savings.reduce((a, b) => a + b, 0) / savings.length)
      }

      const best = offersWithTime.reduce((prev, curr) =>
        curr.offered_price < prev.offered_price ? curr : prev
      )
      setBestOffer(best.id)
    }

    return offersWithTime
  }, [ride, params.id, supabase])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const { data: rideData } = await supabase
        .from('rides')
        .select('*')
        .eq('id', params.id)
        .single()
      setRide(rideData)
      const offersData = await fetchOffers(rideData)
      setOffers(offersData)
      prevOfferCount.current = offersData.length
      setLoading(false)
    }
    loadData()
  }, [params.id])

  // Realtime subscriptions using realtime-service
  useEffect(() => {
    console.log('[v0] Setting up realtime subscriptions for offers')
    
    // Subscribe to new offers
    const offersChannel = realtimeService.subscribeToPriceOffers(
      params.id,
      async (payload) => {
        if (payload.eventType === 'INSERT') {
          console.log('[v0] New offer received:', payload.new)
          const fresh = await fetchOffers()
          setOffers(fresh)

          // Haptic feedback for new offer
          triggerHaptic('medium')
          
          // Show toast for new offer
          const newOffer = payload.new as any
          if (newOffer) {
            const driver = fresh.find(o => o.id === newOffer.id)?.driver
            setNewOfferToast({
              name: driver?.full_name || 'Motorista',
              price: newOffer.offered_price || 0,
            })
            setTimeout(() => setNewOfferToast(null), 3000)
          }

          try { new Audio('/notification.mp3').play().catch(() => {}) } catch {}
        }
      }
    )

    // Subscribe to ride status changes
    const rideChannel = realtimeService.subscribeToRide(
      params.id,
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          console.log('[v0] Ride updated:', payload.new)
          const updated = payload.new as any
          if (updated.status === 'accepted' && updated.driver_id) {
            router.push(`/uppi/ride/${params.id}/tracking`)
          }
        }
      }
    )

    return () => {
      console.log('[v0] Cleaning up realtime subscriptions')
      realtimeService.unsubscribe(offersChannel)
      realtimeService.unsubscribe(rideChannel)
    }
  }, [params.id, fetchOffers, router])

  const handleAccept = async (offer: OfferWithDriver) => {
  triggerHaptic('success')
  setAcceptingId(offer.id)
    try {
      await supabase.from('price_offers').update({ status: 'accepted' }).eq('id', offer.id)
      await supabase.from('rides').update({ driver_id: offer.driver_id, final_price: offer.offered_price, status: 'accepted' }).eq('id', params.id)
      await supabase.from('price_offers').update({ status: 'rejected' }).eq('ride_id', params.id).neq('id', offer.id)
      router.push(`/uppi/ride/${params.id}/tracking`)
    } catch (e) {
      console.error('Error accepting offer:', e)
    } finally {
      setAcceptingId(null)
    }
  }

  const handleCancel = async () => {
    await supabase.from('rides').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', params.id)
    router.push('/uppi/home')
  }

  // Sort: best offer first, then by estimated arrival
  const sortedOffers = [...offers].sort((a, b) => {
    if (a.id === bestOffer) return -1
    if (b.id === bestOffer) return 1
    return (a.estimatedMinutes ?? 99) - (b.estimatedMinutes ?? 99)
  })

  const isMoto = ride?.vehicle_type === 'moto'

  if (loading) {
    return (
      <div className="h-dvh bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-ios-fade-up">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[15px] text-neutral-500 font-medium">Carregando ofertas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh overflow-hidden bg-neutral-50 flex flex-col relative">
      {/* New offer toast */}
      <NewOfferToast
        driverName={newOfferToast?.name || ''}
        price={newOfferToast?.price || 0}
        show={!!newOfferToast}
      />

      {/* iOS Header */}
      <header className="bg-white/80 ios-blur border-b border-neutral-200/40 relative z-10 animate-ios-fade-up">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100/80 ios-press"
            >
              <svg className="w-5 h-5 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-[20px] font-bold text-neutral-900 tracking-tight">
                {offers.length > 0 ? 'Ofertas recebidas' : 'Aguardando ofertas'}
              </h1>
              <p className="text-[13px] text-neutral-500">
                {isMoto ? 'Motos' : 'Carros'} perto de voce
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
              <VehicleIcon type={ride?.vehicle_type || 'economy'} className="w-4 h-4 text-blue-600" />
              <span className="text-[13px] font-bold text-blue-700">
                R$ {ride?.passenger_price_offer?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Route Summary - compact */}
      <div className="px-5 py-2.5 bg-white border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="w-5 h-px bg-neutral-200" />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <p className="text-[13px] text-neutral-600 truncate flex-1">{ride?.pickup_address}</p>
            <svg className="w-3.5 h-3.5 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <p className="text-[13px] text-neutral-600 truncate flex-1">{ride?.dropoff_address}</p>
          </div>
        </div>
      </div>

      {/* Savings banner */}
      {offers.length > 0 && (
        <SavingsBanner averageSavings={averageSavings} offerCount={offers.length} />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto ios-scroll px-5 py-4">
        {offers.length === 0 ? (
          <WaitingState vehicleType={ride?.vehicle_type || 'economy'} />
        ) : (
          <div>
            <p className="text-[13px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              {offers.length} {offers.length === 1 ? 'motorista encontrado' : 'motoristas encontrados'}
            </p>

            <div className="flex flex-col gap-3">
              {sortedOffers.map((offer, index) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  ride={ride}
                  isBest={bestOffer === offer.id}
                  isAccepting={acceptingId === offer.id}
                  onAccept={() => handleAccept(offer)}
                  animationDelay={index * 80}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar with cancel confirmation */}
      <div className="bg-white/90 ios-blur border-t border-neutral-200/40 px-5 py-3 pb-safe-offset-4">
        {showCancelConfirm ? (
          <div className="animate-ios-fade-up">
            <p className="text-[13px] text-neutral-500 text-center mb-2.5 font-medium">Tem certeza que deseja cancelar?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 h-[46px] rounded-[14px] bg-neutral-100 text-[15px] font-bold text-neutral-700 ios-press transition-colors"
              >
                Nao, voltar
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-[46px] rounded-[14px] bg-red-500 text-[15px] font-bold text-white ios-press transition-colors"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="w-full h-[48px] rounded-[14px] bg-neutral-100 text-red-500 text-[16px] font-bold ios-press transition-colors"
          >
            Cancelar solicitacao
          </button>
        )}
      </div>
    </div>
  )
}
