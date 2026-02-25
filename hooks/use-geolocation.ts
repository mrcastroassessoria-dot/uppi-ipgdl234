import { useState, useEffect, useCallback } from 'react'
import { geolocationService, Coordinates, GeolocationOptions } from '@/lib/services/geolocation-service'

interface UseGeolocationResult {
  coordinates: Coordinates | null
  loading: boolean
  error: string | null
  getCurrentPosition: () => Promise<void>
  isAvailable: boolean
}

export function useGeolocation(options?: GeolocationOptions): UseGeolocationResult {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable] = useState(geolocationService.isAvailable())

  const getCurrentPosition = useCallback(async () => {
    if (!isAvailable) {
      setError('Geolocation not supported')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const coords = await geolocationService.getCurrentPosition(options)
      if (coords) {
        setCoordinates(coords)
      } else {
        setError('Could not get location')
      }
    } catch (err: any) {
      setError(err.message || 'Error getting location')
    } finally {
      setLoading(false)
    }
  }, [isAvailable, options])

  return {
    coordinates,
    loading,
    error,
    getCurrentPosition,
    isAvailable,
  }
}

export function useWatchGeolocation(
  options?: GeolocationOptions,
  autoStart: boolean = false
): UseGeolocationResult & { startWatching: () => void; stopWatching: () => void } {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable] = useState(geolocationService.isAvailable())
  const [watchId, setWatchId] = useState<number | null>(null)

  const startWatching = useCallback(() => {
    if (!isAvailable || watchId !== null) return

    setLoading(true)
    setError(null)

    const id = geolocationService.watchPosition(
      (coords) => {
        setCoordinates(coords)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      options
    )

    if (id !== null) {
      setWatchId(id)
    }
  }, [isAvailable, watchId, options])

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      geolocationService.clearWatch(watchId)
      setWatchId(null)
      setLoading(false)
    }
  }, [watchId])

  const getCurrentPosition = useCallback(async () => {
    if (!isAvailable) {
      setError('Geolocation not supported')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const coords = await geolocationService.getCurrentPosition(options)
      if (coords) {
        setCoordinates(coords)
      } else {
        setError('Could not get location')
      }
    } catch (err: any) {
      setError(err.message || 'Error getting location')
    } finally {
      setLoading(false)
    }
  }, [isAvailable, options])

  useEffect(() => {
    if (autoStart) {
      startWatching()
    }

    return () => {
      stopWatching()
    }
  }, [autoStart, startWatching, stopWatching])

  return {
    coordinates,
    loading,
    error,
    getCurrentPosition,
    isAvailable,
    startWatching,
    stopWatching,
  }
}
