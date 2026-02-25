'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCurrentLocation, type Location } from '@/lib/google-maps/utils'

export function useGoogleMaps() {
  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<
    'prompt' | 'granted' | 'denied' | 'loading'
  >('loading')

  const requestLocation = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      setPermissionState('granted')
      
      // Save to session storage
      sessionStorage.setItem('userLocation', JSON.stringify(location))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location')
      setPermissionState('denied')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check for cached location first
    const cached = sessionStorage.getItem('userLocation')
    if (cached) {
      try {
        const location = JSON.parse(cached)
        setUserLocation(location)
        setLoading(false)
        return
      } catch {
        // Invalid cache, continue with fresh request
      }
    }

    // Check permission status
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied')

          result.addEventListener('change', () => {
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied')
          })
        })
        .catch(() => {
          setPermissionState('prompt')
        })
    }

    // Request location on mount
    requestLocation()
  }, [requestLocation])

  return {
    userLocation,
    loading,
    error,
    permissionState,
    requestLocation,
  }
}
