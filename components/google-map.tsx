'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useTheme } from 'next-themes'
import { MapFallback } from '@/components/map-fallback'
import { optimizeRoute, formatCurrency } from '@/lib/google-maps/route-optimizer'

declare global {
  interface Window {
    initGoogleMap?: () => void
    google: any
  }
}

export interface GoogleMapHandle {
  centerOnUser: () => void
  getMapInstance: () => any | null
  drawOptimizedRoute: (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => Promise<void>
}

interface GoogleMapProps {
  onLocationFound?: (lat: number, lng: number) => void
  onMapReady?: (mapInstance: any) => void
  className?: string
}

const DEFAULT_CENTER = { lat: -1.293, lng: -47.926 }
const DEFAULT_ZOOM = 16

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1f' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1f' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e93' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#aeaeb2' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1c3a1c' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4a8c4a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38383a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#48484a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#38383a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#aeaeb2' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2c2c2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1929' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a6fa5' }] },
]

const LIGHT_MAP_STYLES = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve()
      return
    }

    const existingScript = document.getElementById('google-maps-script')
    if (existingScript) {
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

export const GoogleMap = forwardRef<GoogleMapHandle, GoogleMapProps>(
  function GoogleMapInner({ onLocationFound, onMapReady, className }, ref) {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markerRef = useRef<any>(null)
    const circleRef = useRef<any>(null)
    const directionsRendererRef = useRef<any>(null)
    const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'loading'>('loading')
    const [mapLoaded, setMapLoaded] = useState(false)
    const [mapError, setMapError] = useState(false)
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; cost: string; savings: string } | null>(null)
    const retryCountRef = useRef(0)
    const MAX_RETRIES = 2
    const onLocationFoundRef = useRef(onLocationFound)
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    useEffect(() => {
      onLocationFoundRef.current = onLocationFound
    }, [onLocationFound])

    const updateUserPosition = useCallback((lat: number, lng: number) => {
      const pos = { lat, lng }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(pos)
        mapInstanceRef.current.setZoom(DEFAULT_ZOOM)
      }

      if (markerRef.current) {
        markerRef.current.setPosition(pos)
      }

      if (circleRef.current) {
        circleRef.current.setCenter(pos)
      }
    }, [])

    const centerOnUser = useCallback(() => {
      if (!navigator.geolocation) return

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          updateUserPosition(latitude, longitude)
          onLocationFoundRef.current?.(latitude, longitude)
          setPermissionState('granted')
        },
        () => {
          setPermissionState('denied')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    }, [updateUserPosition])

  const drawOptimizedRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => {
    if (!mapInstanceRef.current || !window.google) return

    console.log('[v0] Optimizing route from', origin, 'to', destination)

    try {
      // Call route optimizer
      const result = await optimizeRoute(origin, destination)
      const recommended = result.recommended

      console.log('[v0] Optimized route:', recommended)

      // Initialize directions renderer if not exists
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#2563EB',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        })
      }

      // Use Directions Service to get actual route
      const directionsService = new window.google.maps.DirectionsService()
      const request = {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        avoidTolls: recommended.routeType === 'economical',
      }

      directionsService.route(request, (response: any, status: any) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(response)
          
          const route = response.routes[0]
          const leg = route.legs[0]
          
          // Display optimized route info
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            cost: formatCurrency(recommended.cost),
            savings: recommended.savings 
              ? `Economia: ${formatCurrency(recommended.savings.cost)} • ${Math.round(recommended.savings.time)} min`
              : '',
          })

          console.log('[v0] Route drawn successfully with optimization')
        } else {
          console.error('[v0] Directions request failed:', status)
        }
      })
    } catch (error) {
      console.error('[v0] Route optimization error:', error)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    centerOnUser,
    getMapInstance: () => mapInstanceRef.current,
    drawOptimizedRoute,
  }), [centerOnUser, drawOptimizedRoute])

    const initMap = useCallback(
      (center: { lat: number; lng: number }) => {
        if (!mapContainerRef.current || mapInstanceRef.current) return

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: DEFAULT_ZOOM,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          styles: isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
        })

    mapInstanceRef.current = map
    
    // Notify parent that map is ready
    onMapReady?.(map)

    const marker = new window.google.maps.Marker({
          position: center,
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#2563EB',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          title: 'Sua localização',
        })

        const circle = new window.google.maps.Circle({
          map,
          center,
          radius: 80,
          fillColor: '#2563EB',
          fillOpacity: 0.1,
          strokeColor: '#2563EB',
          strokeOpacity: 0.3,
          strokeWeight: 1,
        })

        markerRef.current = marker
        circleRef.current = circle
        setMapLoaded(true)
      },
      [isDark]
    )

    // Update map styles when theme changes
    useEffect(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setOptions({
          styles: isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
        })
      }
    }, [isDark])

    useEffect(() => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      console.log('[v0] Google Maps API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
      
      if (!apiKey) {
        console.error('[v0] Google Maps API key is missing!')
        return
      }

      let cancelled = false

      async function init() {
        try {
          console.log('[v0] Loading Google Maps script...')
          await loadGoogleMapsScript(apiKey as string)
          console.log('[v0] Google Maps script loaded successfully')
          if (cancelled) return

          // Check geolocation permission
          if (navigator.permissions) {
            try {
              const result = await navigator.permissions.query({ name: 'geolocation' })
              if (cancelled) return
              setPermissionState(result.state as 'prompt' | 'granted' | 'denied')

              result.addEventListener('change', () => {
                setPermissionState(result.state as 'prompt' | 'granted' | 'denied')
              })
            } catch {
              setPermissionState('prompt')
            }
          } else {
            setPermissionState('prompt')
          }

          // Request user location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                if (cancelled) return
                const { latitude, longitude } = position.coords
                initMap({ lat: latitude, lng: longitude })
                onLocationFoundRef.current?.(latitude, longitude)
                setPermissionState('granted')
              },
              () => {
                if (cancelled) return
                initMap(DEFAULT_CENTER)
                setPermissionState('denied')
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            )
          } else {
            initMap(DEFAULT_CENTER)
          }
          } catch (error) {
            console.error('[v0] Error loading Google Maps:', error)
            if (!cancelled) {
              if (retryCountRef.current < MAX_RETRIES) {
                retryCountRef.current++
                console.log(`[v0] Retrying Google Maps load (attempt ${retryCountRef.current})...`)
                // Remove failed script and retry after delay
                const failedScript = document.getElementById('google-maps-script')
                failedScript?.remove()
                setTimeout(() => { if (!cancelled) init() }, 2000 * retryCountRef.current)
              } else {
                console.error('[v0] Google Maps failed after retries, showing fallback')
                setMapError(true)
                // Still try to get user location via GPS
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => { onLocationFoundRef.current?.(pos.coords.latitude, pos.coords.longitude) },
                    () => {}
                  )
                }
              }
            }
          }
        }

        init()

      return () => {
        cancelled = true
      }
    }, [initMap])

    // Show fallback if map completely fails
    if (mapError) {
      return (
        <div className={`relative w-full h-full ${className ?? ''}`}>
          <MapFallback className="w-full h-full" />
        </div>
      )
    }

    return (
      <div className={`relative w-full h-full ${className ?? ''}`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Carregando mapa...</span>
            </div>
          </div>
        )}

        {/* Permission denied banner */}
        {permissionState === 'denied' && mapLoaded && (
          <div className="absolute top-4 left-4 right-16 z-10 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 shadow-md">
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-snug">
              Permita o acesso a sua localização nas configurações do navegador para uma melhor experiência.
            </p>
          </div>
        )}

        {/* Optimized route info */}
        {routeInfo && (
          <div className="absolute bottom-4 left-4 right-4 z-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">Rota Otimizada</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-500 dark:text-neutral-400">Distância</div>
                    <div className="font-semibold text-neutral-900 dark:text-white">{routeInfo.distance}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 dark:text-neutral-400">Tempo</div>
                    <div className="font-semibold text-neutral-900 dark:text-white">{routeInfo.duration}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 dark:text-neutral-400">Custo</div>
                    <div className="font-semibold text-green-600 dark:text-green-500">{routeInfo.cost}</div>
                  </div>
                </div>
                {routeInfo.savings && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-500 font-medium">
                    {routeInfo.savings}
                  </div>
                )}
              </div>
              <button
                onClick={() => setRouteInfo(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
)
