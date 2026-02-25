'use client'

import React from "react"

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete'
import { MapPin, Loader2, Navigation } from 'lucide-react'

interface PlacesSearchProps {
  placeholder?: string
  onPlaceSelect?: (place: {
    placeId: string
    name: string
    address: string
    location: { lat: number; lng: number }
  }) => void
  className?: string
  defaultValue?: string
}

export function PlacesSearch({
  placeholder = 'Buscar endereço...',
  onPlaceSelect,
  className,
  defaultValue = '',
}: PlacesSearchProps) {
  const [input, setInput] = useState(defaultValue)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const {
    predictions,
    loading,
    getPlacePredictions,
    getPlaceDetails,
    clearPredictions,
  } = usePlacesAutocomplete()

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setShowSuggestions(true)
      setSelectedIndex(-1)

      if (value.length > 2) {
        getPlacePredictions(value)
      } else {
        clearPredictions()
      }
    },
    [getPlacePredictions, clearPredictions]
  )

  const handleSelectPlace = useCallback(
    async (placeId: string, description: string) => {
      const details = await getPlaceDetails(placeId)

      if (details?.geometry?.location) {
        setInput(description)
        setShowSuggestions(false)
        clearPredictions()

        onPlaceSelect?.({
          placeId,
          name: details.name || '',
          address: details.formatted_address || description,
          location: {
            lat: details.geometry.location.lat(),
            lng: details.geometry.location.lng(),
          },
        })
      }
    },
    [getPlaceDetails, clearPredictions, onPlaceSelect]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || predictions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < predictions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0) {
            const prediction = predictions[selectedIndex]
            handleSelectPlace(prediction.place_id, prediction.description)
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          inputRef.current?.blur()
          break
      }
    },
    [showSuggestions, predictions, selectedIndex, handleSelectPlace]
  )

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-neutral-100 rounded-2xl pl-12 pr-4 py-3.5 text-[17px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
          autoComplete="off"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50 max-h-[400px] overflow-y-auto"
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() =>
                handleSelectPlace(prediction.place_id, prediction.description)
              }
              className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50'
                  : 'hover:bg-neutral-50 active:bg-neutral-100'
              } ${index !== 0 ? 'border-t border-neutral-100' : ''}`}
            >
              <div className="mt-0.5 text-neutral-400 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-medium text-neutral-900 truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-[13px] text-neutral-500 truncate mt-0.5">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>

              {index === selectedIndex && (
                <div className="flex-shrink-0 text-blue-500">
                  <Navigation className="w-4 h-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && input.length > 2 && !loading && predictions.length === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4 z-50">
          <p className="text-sm text-neutral-500 text-center">
            Nenhum endereço encontrado
          </p>
        </div>
      )}
    </div>
  )
}
