'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Car } from 'lucide-react'

interface Driver {
  id: string
  full_name: string
  avatar_url: string | null
  rating: number
  vehicle_type: string
  vehicle_brand: string
  vehicle_model: string
  vehicle_color: string
  distance_meters: number
  lat: number
  lng: number
}

interface NearbyDriversProps {
  userLat: number
  userLng: number
  mapInstance: any
  onDriversUpdate?: (count: number) => void
}

export function NearbyDrivers({ userLat, userLng, mapInstance, onDriversUpdate }: NearbyDriversProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [markers, setMarkers] = useState<any[]>([])
  const supabase = createClient()

  const fetchNearbyDrivers = useCallback(async () => {
    if (!userLat || !userLng) return

    try {
      const response = await fetch(`/api/v1/drivers/nearby?lat=${userLat}&lng=${userLng}&radius=5`)
      if (!response.ok) return

      const data = await response.json()
      setDrivers(data.drivers || [])
      onDriversUpdate?.(data.drivers?.length || 0)
    } catch (error) {
      console.error('[v0] Error fetching nearby drivers:', error)
    }
  }, [userLat, userLng, onDriversUpdate])

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchNearbyDrivers()
    const interval = setInterval(fetchNearbyDrivers, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [fetchNearbyDrivers])

  // Subscribe to driver location updates via Realtime
  useEffect(() => {
    const channel = supabase
      .channel('driver_locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_profiles',
          filter: 'is_available=eq.true',
        },
        () => {
          // Refresh drivers when any driver updates their location/availability
          fetchNearbyDrivers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchNearbyDrivers])

  // Render markers on map
  useEffect(() => {
    if (!mapInstance || !window.google) return

    // Clear old markers
    markers.forEach((marker) => marker.setMap(null))

    // Create new markers
    const newMarkers = drivers.map((driver) => {
      // Create custom car icon
      const carIcon = {
        path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
        fillColor: getVehicleColor(driver.vehicle_type),
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.2,
        anchor: new window.google.maps.Point(12, 12),
      }

      const marker = new window.google.maps.Marker({
        position: { lat: driver.lat, lng: driver.lng },
        map: mapInstance,
        icon: carIcon,
        title: `${driver.full_name} - ${driver.vehicle_brand} ${driver.vehicle_model}`,
        animation: window.google.maps.Animation.DROP,
      })

      // Info window on click
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              ${
                driver.avatar_url
                  ? `<img src="${driver.avatar_url}" alt="${driver.full_name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />`
                  : '<div style="width: 40px; height: 40px; border-radius: 50%; background: #e5e5ea; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-weight: 600;">?</div>'
              }
              <div>
                <div style="font-weight: 600; font-size: 14px; color: #1c1c1e;">${driver.full_name}</div>
                <div style="font-size: 12px; color: #8e8e93;">⭐ ${driver.rating.toFixed(1)}</div>
              </div>
            </div>
            <div style="font-size: 13px; color: #48484a; margin-bottom: 4px;">
              🚗 ${driver.vehicle_brand} ${driver.vehicle_model}
            </div>
            <div style="font-size: 13px; color: #8e8e93;">
              📍 ${(driver.distance_meters / 1000).toFixed(1)} km de distância
            </div>
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker)
      })

      return marker
    })

    setMarkers(newMarkers)

    return () => {
      newMarkers.forEach((marker) => marker.setMap(null))
    }
  }, [drivers, mapInstance])

  return null
}

function getVehicleColor(vehicleType: string): string {
  const colors: Record<string, string> = {
    economy: '#48484a',
    electric: '#34c759',
    premium: '#007aff',
    suv: '#5856d6',
    moto: '#ff9500',
  }
  return colors[vehicleType] || '#1c1c1e'
}
