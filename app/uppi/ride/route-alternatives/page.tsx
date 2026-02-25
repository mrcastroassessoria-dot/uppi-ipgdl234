'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, TrendingUp, AlertCircle, Check, Users, Star } from 'lucide-react'
import { useHaptic } from '@/hooks/use-haptic'
import { createClient } from '@/lib/supabase/client'

interface RouteAlternative {
  routeIndex: number
  distance: number
  duration: number
  distanceText: string
  durationText: string
  polyline: string
  summary: string
  basePrice: number
  estimatedPrice: number
  priceModifier: number
  warnings: string[]
  isPopular?: boolean
  usageCount?: number
  uniqueDrivers?: number
  avgRating?: number
}

export default function RouteAlternativesPage() {
  const [alternatives, setAlternatives] = useState<RouteAlternative[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [polylines, setPolylines] = useState<any[]>([])
  const mapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const haptic = useHaptic()

  const originLat = parseFloat(searchParams.get('originLat') || '0')
  const originLng = parseFloat(searchParams.get('originLng') || '0')
  const destLat = parseFloat(searchParams.get('destLat') || '0')
  const destLng = parseFloat(searchParams.get('destLng') || '0')
  const vehicleType = searchParams.get('vehicleType') || 'economy'

  useEffect(() => {
    fetchAlternatives()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && !mapInstance) {
      initMap()
    }
  }, [mapInstance])

  useEffect(() => {
    if (mapInstance && alternatives.length > 0) {
      drawRoutes()
    }
  }, [mapInstance, alternatives, selectedRoute])

  const initMap = () => {
    if (!window.google || !mapRef.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: originLat, lng: originLng },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
    })

    setMapInstance(map)
  }

  const fetchAlternatives = async () => {
    setLoading(true)
    try {
      // Buscar rotas do Google Maps
      const response = await fetch('/api/v1/routes/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: originLat, lng: originLng },
          destination: { lat: destLat, lng: destLng },
          vehicleType,
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch routes')

      const data = await response.json()
      const googleRoutes = data.alternatives || []

      // Buscar rotas populares de motoristas no Supabase
      const supabase = createClient()
      const { data: popularRoutes } = await supabase.rpc('get_popular_routes_nearby', {
        p_origin_lat: originLat,
        p_origin_lng: originLng,
        p_dest_lat: destLat,
        p_dest_lng: destLng,
        p_radius_km: 2.0
      })

      console.log('[v0] Popular routes found:', popularRoutes?.length || 0)

      // Adicionar badge de rota popular nas rotas do Google que coincidem
      const enrichedRoutes = googleRoutes.map((route: RouteAlternative) => {
        const matchingPopular = popularRoutes?.find((pr: any) => 
          Math.abs(pr.avg_distance_km - route.distance) < 0.5 && // Tolerância de 500m
          Math.abs(pr.avg_duration_min - route.duration) < 5 // Tolerância de 5min
        )

        if (matchingPopular) {
          return {
            ...route,
            isPopular: true,
            usageCount: matchingPopular.usage_count,
            uniqueDrivers: matchingPopular.unique_drivers,
            avgRating: matchingPopular.avg_rating,
          }
        }
        return route
      })

      setAlternatives(enrichedRoutes)
      setSelectedRoute(0) // Select cheapest by default
    } catch (error) {
      console.error('[v0] Error fetching alternatives:', error)
    } finally {
      setLoading(false)
    }
  }

  const drawRoutes = () => {
    if (!mapInstance || !window.google) return

    // Clear existing polylines
    polylines.forEach((p) => p.setMap(null))

    const newPolylines: any[] = []
    const bounds = new window.google.maps.LatLngBounds()

    alternatives.forEach((route, index) => {
      const isSelected = selectedRoute === index
      const path = window.google.maps.geometry.encoding.decodePath(route.polyline)

      const polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: isSelected ? '#3b82f6' : '#94a3b8',
        strokeOpacity: isSelected ? 1 : 0.5,
        strokeWeight: isSelected ? 6 : 4,
        map: mapInstance,
        zIndex: isSelected ? 1000 : index,
      })

      newPolylines.push(polyline)

      // Extend bounds
      path.forEach((point: any) => bounds.extend(point))
    })

    // Add markers
    new window.google.maps.Marker({
      position: { lat: originLat, lng: originLng },
      map: mapInstance,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    })

    new window.google.maps.Marker({
      position: { lat: destLat, lng: destLng },
      map: mapInstance,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    })

    mapInstance.fitBounds(bounds, { padding: 60 })
    setPolylines(newPolylines)
  }

  const handleSelectRoute = (index: number) => {
    haptic.selection()
    setSelectedRoute(index)
  }

  const handleConfirm = () => {
    if (selectedRoute === null) return

    haptic.success()
    const selected = alternatives[selectedRoute]

    // Store selected route and go to vehicle selection
    sessionStorage.setItem(
      'selectedRoute',
      JSON.stringify({
        ...selected,
        originLat,
        originLng,
        destLat,
        destLng,
      })
    )

    router.push(`/uppi/ride/select?distanceKm=${selected.distance.toFixed(2)}&durationMin=${Math.round(selected.duration)}`)
  }

  const cheapestRoute = alternatives[0]
  const fastestRoute = alternatives.reduce((fastest, current) =>
    current.duration < fastest.duration ? current : fastest
  , alternatives[0] || null)

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="pt-safe-offset-12 pb-3 px-4 border-b border-border/50 bg-card/50 ios-blur z-20">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="ios-press">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-[20px] font-bold text-foreground">Escolha a Rota</h1>
          <div className="w-6" />
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 relative min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Routes List */}
      <div className="bg-background rounded-t-[24px] -mt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] z-20 max-h-[45dvh] flex flex-col">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-9 h-[5px] bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="px-4 pb-2">
          <p className="text-[15px] font-semibold text-muted-foreground">
            {alternatives.length} rotas disponíveis
          </p>
        </div>

        <div className="flex-1 overflow-y-auto ios-scroll px-4 pb-24">
          <div className="flex flex-col gap-3">
            {alternatives.map((route, index) => {
              const isSelected = selectedRoute === index
              const isCheapest = route.routeIndex === cheapestRoute?.routeIndex
              const isFastest = route.routeIndex === fastestRoute?.routeIndex
              const savings = cheapestRoute ? route.estimatedPrice - cheapestRoute.estimatedPrice : 0

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectRoute(index)}
                  className={`w-full text-left p-4 rounded-2xl border-2 ios-press ios-smooth ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[17px] text-foreground">{route.summary}</p>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-[20px] text-foreground">
                      R$ {route.estimatedPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    {isCheapest && (
                      <div className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold">
                        MAIS BARATO
                      </div>
                    )}
                    {isFastest && (
                      <div className="px-2 py-1 rounded-lg bg-blue-500 text-white text-[11px] font-bold">
                        MAIS RÁPIDO
                      </div>
                    )}
                    {savings > 0 && (
                      <div className="px-2 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold">
                        +R$ {savings.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[14px] text-muted-foreground">{route.distanceText}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[14px] text-muted-foreground">{route.durationText}</span>
                    </div>
                    {route.priceModifier !== 1 && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[14px] text-muted-foreground">
                          {(route.priceModifier * 100 - 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Warnings */}
                  {route.warnings.length > 0 && (
                    <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        {route.warnings.map((warning, i) => (
                          <p key={i} className="text-[12px] text-amber-700 dark:text-amber-300">
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <div className="px-4 pb-safe-offset-4 pt-3 border-t border-border/50 bg-background">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedRoute === null || loading}
            className="w-full bg-primary text-primary-foreground rounded-[18px] py-4 font-bold text-[17px] ios-press disabled:opacity-50"
          >
            {selectedRoute !== null && alternatives[selectedRoute]
              ? `Confirmar - R$ ${alternatives[selectedRoute].estimatedPrice.toFixed(2)}`
              : 'Selecione uma rota'}
          </button>
        </div>
      </div>
    </div>
  )
}
