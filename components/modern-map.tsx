'use client'

import { useRef, useEffect, useState } from 'react'
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps'
import { useGoogleMaps } from '@/hooks/use-google-maps'

interface ModernMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  showUserLocation?: boolean
  onLocationChange?: (lat: number, lng: number) => void
}

export function ModernMap({
  center,
  zoom = 15,
  className,
  showUserLocation = true,
  onLocationChange,
}: ModernMapProps) {
  const { userLocation, loading, error } = useGoogleMaps()
  const [mapCenter, setMapCenter] = useState(center || { lat: -23.5505, lng: -46.6333 })

  // Update center when user location is found
  useEffect(() => {
    if (showUserLocation && userLocation) {
      setMapCenter(userLocation)
      onLocationChange?.(userLocation.lat, userLocation.lng)
    }
  }, [userLocation, showUserLocation, onLocationChange])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <div className="text-center p-4">
          <p className="text-sm text-red-600 font-medium">Erro ao carregar mapa</p>
          <p className="text-xs text-neutral-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Carregando mapa...</span>
        </div>
      </div>
    )
  }

  return (
    <Map
      mapId="uppi-map"
      defaultCenter={mapCenter}
      defaultZoom={zoom}
      gestureHandling="greedy"
      disableDefaultUI={true}
      className={className}
      styles={[
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }],
        },
      ]}
    >
      {showUserLocation && userLocation && (
        <AdvancedMarker position={userLocation}>
          <Pin
            background="#2563EB"
            borderColor="#FFFFFF"
            glyphColor="#FFFFFF"
            scale={1.2}
          />
        </AdvancedMarker>
      )}
    </Map>
  )
}

// Component to recenter map on user location
export function MapRecenterControl() {
  const map = useMap()
  const { userLocation, requestLocation } = useGoogleMaps()

  const handleRecenter = () => {
    if (userLocation && map) {
      map.panTo(userLocation)
      map.setZoom(16)
    } else {
      requestLocation()
    }
  }

  return (
    <button
      type="button"
      onClick={handleRecenter}
      className="w-11 h-11 bg-white/95 ios-blur rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] ios-press"
      aria-label="Centralizar no usuário"
    >
      <svg
        className="w-5 h-5 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2v4m0 12v4m10-10h-4M6 12H2"
        />
      </svg>
    </button>
  )
}
