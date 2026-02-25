'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e93' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#aeaeb2' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1c3a1c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38383a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#48484a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#38383a' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1929' }] },
]

const LIGHT_MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

declare global {
  interface Window {
    initGoogleMap?: () => void
    google: any
  }
}

interface RouteMapProps {
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  className?: string
  originLabel?: string
  destinationLabel?: string
  showInfoWindows?: boolean
  onRecenterReady?: (recenterFn: () => void) => void
  bottomPadding?: number
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve()
      return
    }

    const existingScript = document.getElementById('google-maps-script')
    if (existingScript) {
      if (window.google?.maps) {
        resolve()
        return
      }
      existingScript.addEventListener('load', () => resolve())
      return
    }

    window.initGoogleMap = () => {
      resolve()
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap&libraries=places`
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

export function RouteMap({ origin, destination, className, originLabel, destinationLabel, showInfoWindows, onRecenterReady, bottomPadding = 40 }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const directionsRendererRef = useRef<any | null>(null)
  const directionsResultRef = useRef<any | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Update map styles when theme changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
      })
      // Update route polyline color
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setOptions({
          polylineOptions: {
            strokeColor: isDark ? '#0A84FF' : '#1a1a1a',
            strokeWeight: 5,
            strokeOpacity: 0.85,
          },
        })
        if (directionsResultRef.current) {
          directionsRendererRef.current.setDirections(directionsResultRef.current)
        }
      }
    }
  }, [isDark])

  const recenterMap = useCallback(() => {
    if (!mapInstanceRef.current) return
    
    // Centraliza na localização atual (origem/pickup) com zoom 16
    mapInstanceRef.current.setCenter({ lat: origin.lat, lng: origin.lng })
    mapInstanceRef.current.setZoom(16)
  }, [origin])

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const midLat = (origin.lat + destination.lat) / 2
    const midLng = (origin.lng + destination.lng) / 2

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: midLat, lng: midLng },
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      scaleControl: false,
      rotateControl: false,
      gestureHandling: 'greedy',
      styles: isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
    })

    mapInstanceRef.current = map

    // Create Directions Renderer
    const renderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: isDark ? '#0A84FF' : '#1a1a1a',
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    })
    directionsRendererRef.current = renderer

    // Request directions
    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          directionsResultRef.current = result
          renderer.setDirections(result)

          // Add origin marker (blue circle with white ring - like Ridy)
          const originMarker = new window.google.maps.Marker({
            position: { lat: origin.lat, lng: origin.lng },
            map,
            icon: {
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="14" r="12" fill="#2563EB" stroke="white" strokeWidth="3"/>
                  <circle cx="14" cy="14" r="4" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(28, 28),
              anchor: new window.google.maps.Point(14, 14),
            },
            title: 'Origem',
          })

          // Add destination marker (green with pin icon - like Ridy)
          const destMarker = new window.google.maps.Marker({
            position: { lat: destination.lat, lng: destination.lng },
            map,
            icon: {
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" strokeWidth="3"/>
                  <path d="M16 9c-2.76 0-5 2.24-5 5 0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.75c-.97 0-1.75-.78-1.75-1.75s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.75-1.75 1.75z" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 16),
            },
            title: 'Destino',
          })

          // Show info windows with labels if enabled
          if (showInfoWindows) {
            const sw = 'stroke-' + 'width'
            const originInfoContent = `
              <div style="display:flex;align-items:center;gap:10px;padding:4px 2px;min-width:180px;">
                <div style="width:32px;height:32px;background:#2563EB;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" ${sw}="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                </div>
                <div style="overflow:hidden;">
                  <div style="font-size:11px;color:#6b7280;font-weight:500;">Pick-up point</div>
                  <div style="font-size:13px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${originLabel || 'Origem'}</div>
                </div>
              </div>`
            const originInfo = new window.google.maps.InfoWindow({
              content: originInfoContent,
              disableAutoPan: true,
            })
            originInfo.open(map, originMarker)

            const destInfoContent = `
              <div style="display:flex;align-items:center;gap:10px;padding:4px 2px;min-width:180px;">
                <div style="width:32px;height:32px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div style="overflow:hidden;">
                  <div style="font-size:11px;color:#6b7280;font-weight:500;">Destination</div>
                  <div style="font-size:13px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${destinationLabel || 'Destino'}</div>
                </div>
              </div>`
            const destInfo = new window.google.maps.InfoWindow({
              content: destInfoContent,
              disableAutoPan: true,
            })
            destInfo.open(map, destMarker)
          }

          // Fit bounds to show entire route
          const bounds = new window.google.maps.LatLngBounds()
          bounds.extend({ lat: origin.lat, lng: origin.lng })
          bounds.extend({ lat: destination.lat, lng: destination.lng })
          map.fitBounds(bounds, { top: 100, bottom: bottomPadding, left: 40, right: 40 })
        } else {
          // Fallback: just show markers without route line
          new window.google.maps.Marker({
            position: { lat: origin.lat, lng: origin.lng },
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2563EB',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
            },
          })

          new window.google.maps.Marker({
            position: { lat: destination.lat, lng: destination.lng },
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#F97316',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 3,
            },
          })

          const bounds = new window.google.maps.LatLngBounds()
          bounds.extend({ lat: origin.lat, lng: origin.lng })
          bounds.extend({ lat: destination.lat, lng: destination.lng })
          map.fitBounds(bounds, { top: 80, bottom: bottomPadding, left: 50, right: 50 })
        }

        setMapLoaded(true)
        
        // Expose recenter function to parent
        if (onRecenterReady) {
          onRecenterReady(recenterMap)
        }
      }
    )
  }, [origin, destination, showInfoWindows, originLabel, destinationLabel, onRecenterReady, recenterMap, bottomPadding])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError('Chave do Google Maps nao configurada')
      return
    }

    let cancelled = false

    async function init() {
      try {
        await loadGoogleMapsScript(apiKey as string)
        if (cancelled) return
        initMap()
      } catch {
        if (!cancelled) {
          setError('Falha ao carregar o mapa')
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [initMap])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-neutral-200 dark:bg-neutral-900 ${className ?? ''}`}>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{error}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Carregando rota...</span>
          </div>
        </div>
      )}
    </div>
  )
}
