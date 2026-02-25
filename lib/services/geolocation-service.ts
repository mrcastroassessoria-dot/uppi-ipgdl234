export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

class GeolocationService {
  /**
   * Get current user position
   */
  async getCurrentPosition(options?: GeolocationOptions): Promise<Coordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('[v0] Geolocation not supported')
        resolve(null)
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          }
          resolve(coords)
        },
        (error) => {
          console.error('[v0] Geolocation error:', error.message)
          resolve(null)
        },
        defaultOptions
      )
    })
  }

  /**
   * Watch user position changes
   */
  watchPosition(
    onSuccess: (coords: Coordinates) => void,
    onError?: (error: GeolocationPositionError) => void,
    options?: GeolocationOptions
  ): number | null {
    if (!navigator.geolocation) {
      console.error('[v0] Geolocation not supported')
      return null
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 1000,
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        }
        onSuccess(coords)
      },
      (error) => {
        console.error('[v0] Watch position error:', error.message)
        onError?.(error)
      },
      defaultOptions
    )

    return watchId
  }

  /**
   * Stop watching position
   */
  clearWatch(watchId: number) {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  /**
   * Check if geolocation is available
   */
  isAvailable(): boolean {
    return 'geolocation' in navigator
  }

  /**
   * Request permission (for browsers that require explicit permission)
   */
  async requestPermission(): Promise<PermissionState | null> {
    if (!navigator.permissions) {
      console.warn('[v0] Permissions API not supported')
      return null
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      return result.state
    } catch (error) {
      console.error('[v0] Permission check error:', error)
      return null
    }
  }

  /**
   * Calculate distance between two coordinates (in meters)
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180
    const φ2 = (coord2.latitude * Math.PI) / 180
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Format coordinates for display
   */
  formatCoordinates(coords: Coordinates, decimals: number = 6): string {
    return `${coords.latitude.toFixed(decimals)}, ${coords.longitude.toFixed(decimals)}`
  }
}

export const geolocationService = new GeolocationService()
