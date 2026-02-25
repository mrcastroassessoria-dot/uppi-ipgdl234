'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface SearchAddressProps {
  onSelect: (address: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  defaultValue?: string
}

export function SearchAddress({ onSelect, placeholder = 'Digite o endereço...', defaultValue = '' }: SearchAddressProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/v1/places/autocomplete?input=${encodeURIComponent(query)}`)
        const data = await response.json()
        setSuggestions(data.predictions || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('[v0] Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = async (suggestion: any) => {
    setQuery(suggestion.description)
    setShowSuggestions(false)
    
    // Get place details to get coordinates
    try {
      const response = await fetch(`/api/v1/places/details?place_id=${suggestion.place_id}`)
      const data = await response.json()
      
      if (data.result) {
        onSelect(suggestion.description, {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng
        })
      } else {
        onSelect(suggestion.description)
      }
    } catch (error) {
      console.error('[v0] Place details error:', error)
      onSelect(suggestion.description)
    }
  }

  const handleUseCurrentLocation = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })

        const { latitude, longitude } = position.coords
        
        // Reverse geocode to get address using our API
        const response = await fetch('/api/v1/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude })
        })
        const data = await response.json()
        
        setQuery(data.address)
        onSelect(data.address, { lat: latitude, lng: longitude })
      } catch (error) {
        console.error('[v0] Geolocation error:', error)
        alert('Não foi possível acessar sua localização')
      }
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pr-10 border-blue-200 focus:border-blue-600 focus:ring-blue-600"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={handleUseCurrentLocation}
          variant="outline"
          size="icon"
          className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
          title="Usar localização atual"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 p-0 border-blue-200 shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-blue-100 last:border-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blue-900 font-medium truncate">{suggestion.description}</p>
                </div>
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  )
}
