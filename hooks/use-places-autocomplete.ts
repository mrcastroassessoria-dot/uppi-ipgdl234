'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { google } from 'google-maps'

export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export function usePlacesAutocomplete() {
  const places = useMapsLibrary('places')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)

  useEffect(() => {
    if (!places) return

    // Initialize services
    autocompleteService.current = new google.maps.places.AutocompleteService()
    
    // PlacesService requires a map or div element
    const div = document.createElement('div')
    placesService.current = new google.maps.places.PlacesService(div)
  }, [places])

  const getPlacePredictions = useCallback(
    async (input: string) => {
      if (!autocompleteService.current || !input) {
        setPredictions([])
        return
      }

      setLoading(true)

      try {
        const result = await autocompleteService.current.getPlacePredictions({
          input,
          componentRestrictions: { country: 'br' }, // Restrict to Brazil
        })

        setPredictions(result?.predictions || [])
      } catch (error) {
        console.error('[v0] Places autocomplete error:', error)
        setPredictions([])
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getPlaceDetails = useCallback(
    (placeId: string): Promise<google.maps.places.PlaceResult | null> => {
      return new Promise((resolve) => {
        if (!placesService.current) {
          resolve(null)
          return
        }

        placesService.current.getDetails(
          {
            placeId,
            fields: ['geometry', 'formatted_address', 'name', 'place_id'],
          },
          (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && result) {
              resolve(result)
            } else {
              resolve(null)
            }
          }
        )
      })
    },
    []
  )

  const clearPredictions = useCallback(() => {
    setPredictions([])
  }, [])

  return {
    predictions,
    loading,
    getPlacePredictions,
    getPlaceDetails,
    clearPredictions,
  }
}
