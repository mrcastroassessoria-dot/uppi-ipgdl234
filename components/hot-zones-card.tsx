'use client'

import { useEffect, useState } from 'react'
import { Flame, TrendingUp, MapPin, Navigation } from 'lucide-react'

interface HotZone {
  zone_name: string
  zone_lat: number
  zone_lng: number
  recent_rides: number
  avg_price: number
  distance_km: number
  recommendation_score: number
}

interface HotZonesCardProps {
  driverLat: number
  driverLng: number
  onZoneClick?: (zone: HotZone) => void
}

export function HotZonesCard({ driverLat, driverLng, onZoneClick }: HotZonesCardProps) {
  const [hotZones, setHotZones] = useState<HotZone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (driverLat && driverLng) {
      fetchHotZones()
      // Refresh every 5 minutes
      const interval = setInterval(fetchHotZones, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [driverLat, driverLng])

  const fetchHotZones = async () => {
    try {
      const response = await fetch(`/api/v1/drivers/hot-zones?lat=${driverLat}&lng=${driverLng}&radius=5`)
      if (!response.ok) return

      const data = await response.json()
      setHotZones(data.hotZones || [])
    } catch (error) {
      console.error('[v0] Error fetching hot zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHeatLevel = (score: number, index: number) => {
    if (index === 0) return { color: 'from-red-500 to-orange-500', intensity: 'MUITO ALTA' }
    if (index === 1) return { color: 'from-orange-500 to-amber-500', intensity: 'ALTA' }
    if (index === 2) return { color: 'from-amber-500 to-yellow-500', intensity: 'MÉDIA-ALTA' }
    return { color: 'from-yellow-500 to-emerald-500', intensity: 'MÉDIA' }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-[17px] text-foreground">Zonas Quentes</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (hotZones.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-bold text-[17px] text-foreground">Zonas Quentes</h3>
        </div>
        <p className="text-[14px] text-muted-foreground text-center py-4">
          Nenhuma zona quente encontrada nas proximidades
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-[17px] text-foreground">Zonas Quentes</h3>
        </div>
        <div className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-bold">
          {hotZones.length} ZONAS
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground mb-3">
        Áreas com maior demanda de corridas próximas a você
      </p>

      <div className="flex flex-col gap-2">
        {hotZones.slice(0, 5).map((zone, index) => {
          const heat = getHeatLevel(zone.recommendation_score, index)
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => onZoneClick?.(zone)}
              className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-secondary/50 to-card border border-border/50 ios-press"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`px-2 py-0.5 rounded-md bg-gradient-to-r ${heat.color} text-white text-[10px] font-bold`}>
                      {heat.intensity}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Rank #{index + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[11px] text-muted-foreground">Corridas</span>
                      </div>
                      <span className="text-[15px] font-bold text-foreground">{zone.recent_rides}</span>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">Preço Médio</span>
                      </div>
                      <span className="text-[15px] font-bold text-foreground">
                        R$ {zone.avg_price.toFixed(0)}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-[11px] text-muted-foreground">Distância</span>
                      </div>
                      <span className="text-[15px] font-bold text-foreground">
                        {zone.distance_km.toFixed(1)} km
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {hotZones.length > 5 && (
        <button
          type="button"
          className="w-full mt-2 py-2 text-[14px] font-semibold text-primary text-center ios-press"
        >
          Ver todas as {hotZones.length} zonas
        </button>
      )}
    </div>
  )
}
