"use client"

import { useState, useEffect, useCallback } from "react"

interface LocationTagProps {
  className?: string
}

export function LocationTag({ className }: LocationTagProps) {
  const [showTime, setShowTime] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [city, setCity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch city from reverse geocoding
  const fetchCity = useCallback(async (lat: number, lng: number) => {
    try {
      // Wait for Google Maps to be loaded
      if (!window.google?.maps) {
        // Retry after a short delay
        setTimeout(() => fetchCity(lat, lng), 500)
        return
      }

      const geocoder = new window.google.maps.Geocoder()
      const response = await geocoder.geocode({
        location: { lat, lng },
      })

      if (response.results && response.results.length > 0) {
        // Look for the city (locality) in the address components
        for (const result of response.results) {
          for (const component of result.address_components) {
            if (
              component.types.includes("administrative_area_level_2") ||
              component.types.includes("locality")
            ) {
              setCity(component.short_name)
              setLoading(false)
              return
            }
          }
        }
        // Fallback: use sublocality or first result
        for (const result of response.results) {
          for (const component of result.address_components) {
            if (component.types.includes("sublocality") || component.types.includes("administrative_area_level_1")) {
              setCity(component.short_name)
              setLoading(false)
              return
            }
          }
        }
      }
      setCity("Localizando...")
      setLoading(false)
    } catch {
      setCity(null)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Try to get location from sessionStorage first
    const stored = sessionStorage.getItem("userLocation")
    if (stored) {
      const { lat, lng } = JSON.parse(stored)
      fetchCity(lat, lng)
      return
    }

    // Otherwise request geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchCity(position.coords.latitude, position.coords.longitude)
        },
        () => {
          setCity(null)
          setLoading(false)
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      )
    } else {
      setCity(null)
      setLoading(false)
    }
  }, [fetchCity])

  // Update time every second when showing time
  useEffect(() => {
    if (!showTime) return
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [showTime])

  // Auto-hide time after 3 seconds
  useEffect(() => {
    if (!showTime) return
    const timeout = setTimeout(() => setShowTime(false), 3000)
    return () => clearTimeout(timeout)
  }, [showTime])

  if (loading || !city) return null

  return (
    <button
      type="button"
      onClick={() => setShowTime(!showTime)}
      className={`flex items-center gap-1.5 bg-secondary/80 rounded-full px-2.5 py-1 active:scale-95 transition-all duration-200 overflow-hidden ${className ?? ""}`}
    >
      {/* Live pulse */}
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>

      {/* Text */}
      <span className="text-[11px] font-semibold text-foreground whitespace-nowrap transition-all duration-300">
        {showTime ? currentTime : city}
      </span>
    </button>
  )
}
