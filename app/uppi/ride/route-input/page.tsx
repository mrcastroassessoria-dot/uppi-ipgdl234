'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Navigation, Loader2, X, Plus, Clock, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Prediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  isFromHistory?: boolean
  searchCount?: number
  lastUsed?: string
}

interface StopData {
  address: string
  coords: { lat: number; lng: number } | null
}

export default function RouteInputPage() {
  const router = useRouter()
  const [currentAddress, setCurrentAddress] = useState('Buscando sua localizacao...')
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(true)
  const [destination, setDestination] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loadingPredictions, setLoadingPredictions] = useState(false)
  // Multi-stop state
  const [stops, setStops] = useState<StopData[]>([])
  const [activeField, setActiveField] = useState<'destination' | number>('destination')
  const [stopInputs, setStopInputs] = useState<string[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const stopInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_STOPS = 3

  useEffect(() => {
    const cached = sessionStorage.getItem('userLocation')
    if (cached) {
      const coords = JSON.parse(cached)
      setCurrentCoords(coords)
      reverseGeocode(coords.lat, coords.lng)
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCurrentCoords({ lat: latitude, lng: longitude })
          sessionStorage.setItem('userLocation', JSON.stringify({ lat: latitude, lng: longitude }))
          reverseGeocode(latitude, longitude)
        },
        () => {
          if (!cached) {
            setCurrentAddress('Localizacao nao disponivel')
            setLoadingLocation(false)
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else if (!cached) {
      setCurrentAddress('Localizacao nao disponivel')
      setLoadingLocation(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      if (typeof window.google === 'undefined' || !window.google.maps) {
        setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        setLoadingLocation(false)
        return
      }

      const geocoder = new window.google.maps.Geocoder()
      const latlng = { lat, lng }

      geocoder.geocode({ location: latlng, language: 'pt-BR' }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setCurrentAddress(results[0].formatted_address)
        } else {
          setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        }
        setLoadingLocation(false)
      })
    } catch {
      setCurrentAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      setLoadingLocation(false)
    }
  }

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setPredictions([])
      return
    }

    setLoadingPredictions(true)
    
    try {
      const supabase = createClient()
      
      // 1. Buscar no histórico primeiro (tipo 99)
      const { data: { user } } = await supabase.auth.getUser()
      let historyResults: Prediction[] = []
      
      if (user) {
        const { data: history } = await supabase.rpc('search_address_history', {
          p_user_id: user.id,
          p_query: query,
          p_limit: 5
        })
        
        if (history && history.length > 0) {
          historyResults = history.map((h: any) => ({
            place_id: h.place_id || `history-${h.id}`,
            description: h.formatted_address,
            structured_formatting: {
              main_text: h.street_name && h.street_number 
                ? `${h.street_name}, ${h.street_number}`
                : h.street_name || h.address,
              secondary_text: h.neighborhood || ''
            },
            isFromHistory: true,
            searchCount: h.search_count,
            lastUsed: h.last_used_at
          }))
          
        }
      }
      
      // 2. Buscar no Google Maps se necessário
      let googleResults: Prediction[] = []
      if (typeof window.google !== 'undefined' && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService()
        
        await new Promise<void>((resolve) => {
          service.getPlacePredictions(
            {
              input: query,
              componentRestrictions: { country: 'br' },
              language: 'pt-BR',
            },
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                googleResults = predictions
                  .filter(p => !historyResults.some(h => h.place_id === p.place_id))
                  .map(p => ({
                    place_id: p.place_id,
                    description: p.description,
                    structured_formatting: p.structured_formatting,
                    isFromHistory: false
                  }))
              }
              resolve()
            }
          )
        })
      }
      
      // 3. Combinar: histórico primeiro, depois Google Maps
      const combined = [...historyResults, ...googleResults]
      setPredictions(combined)
      
    } catch (error) {
      console.error('Search error:', error)
      setPredictions([])
    } finally {
      setLoadingPredictions(false)
    }
  }, [])

  const handleInputChange = (value: string, field: 'destination' | number) => {
    if (field === 'destination') {
      setDestination(value)
    } else {
      const newInputs = [...stopInputs]
      newInputs[field] = value
      setStopInputs(newInputs)
    }
    setActiveField(field)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchPlaces(value)
    }, 400)
  }

  const getPlaceCoords = (placeId: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.places) {
        resolve(null)
        return
      }
      const div = document.createElement('div')
      const service = new window.google.maps.places.PlacesService(div)
      service.getDetails(
        { placeId, fields: ['geometry'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            resolve({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            })
          } else {
            resolve(null)
          }
        }
      )
    })
  }

  const handleSelectPlace = async (prediction: Prediction) => {
    const coords = await getPlaceCoords(prediction.place_id)
    setPredictions([])
    
    // Salvar no histórico do Supabase
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && !prediction.isFromHistory) {
      // Extrair componentes do endereço para busca inteligente
      const parts = prediction.description.split(',').map(p => p.trim())
      const mainText = prediction.structured_formatting?.main_text || ''
      const streetMatch = mainText.match(/^(.*?)(?:,\s*(\d+))?$/)
      
      await supabase.rpc('record_address_search', {
        p_user_id: user.id,
        p_address: mainText,
        p_formatted_address: prediction.description,
        p_place_id: prediction.place_id,
        p_lat: coords?.lat,
        p_lng: coords?.lng,
        p_street_name: streetMatch?.[1],
        p_street_number: streetMatch?.[2] || parts.find(p => /^\d+/.test(p)),
        p_neighborhood: parts[1] || prediction.structured_formatting?.secondary_text,
        p_address_type: activeField === 'destination' ? 'destination' : 'stop'
      })
    }

    // Salvar também nos favoritos locais (localStorage)
    const savedFavorites = localStorage.getItem('uppi_favorite_addresses')
    const favorites: string[] = savedFavorites ? JSON.parse(savedFavorites) : []
    
    // Adicionar no início e remover duplicatas
    const updatedFavorites = [
      prediction.description,
      ...favorites.filter(addr => addr !== prediction.description)
    ].slice(0, 10) // Manter apenas os últimos 10
    
    localStorage.setItem('uppi_favorite_addresses', JSON.stringify(updatedFavorites))

    if (activeField === 'destination') {
      setDestination(prediction.description)

      // If no stops, navigate directly
      if (stops.length === 0) {
        const route = {
          pickup: currentAddress,
          pickupCoords: currentCoords,
          destination: prediction.description,
          destinationCoords: coords,
          stops: [],
        }
        sessionStorage.setItem('rideRoute', JSON.stringify(route))
        router.push('/uppi/ride/select')
        return
      }

      // If we have stops, store destination and check if all stops are complete
      const allStopsComplete = stops.every(s => s.address)
      if (allStopsComplete) {
        const route = {
          pickup: currentAddress,
          pickupCoords: currentCoords,
          destination: prediction.description,
          destinationCoords: coords,
          stops,
        }
        sessionStorage.setItem('rideRoute', JSON.stringify(route))
        router.push('/uppi/ride/select')
      }
    } else {
      // Selecting a stop
      const idx = activeField as number
      const newStops = [...stops]
      newStops[idx] = { address: prediction.description, coords }
      setStops(newStops)

      const newInputs = [...stopInputs]
      newInputs[idx] = prediction.description
      setStopInputs(newInputs)

      // Focus next empty field
      if (idx < stops.length - 1 && !stops[idx + 1]?.address) {
        setActiveField(idx + 1)
        setTimeout(() => stopInputRefs.current[idx + 1]?.focus(), 100)
      } else if (!destination) {
        setActiveField('destination')
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  const addStop = () => {
    if (stops.length >= MAX_STOPS) return
    const newStops = [...stops, { address: '', coords: null }]
    setStops(newStops)
    setStopInputs([...stopInputs, ''])
    setActiveField(newStops.length - 1)
    setTimeout(() => stopInputRefs.current[newStops.length - 1]?.focus(), 200)
  }

  const removeStop = (index: number) => {
    const newStops = stops.filter((_, i) => i !== index)
    const newInputs = stopInputs.filter((_, i) => i !== index)
    setStops(newStops)
    setStopInputs(newInputs)
    setActiveField('destination')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const activeQuery = activeField === 'destination' ? destination : (stopInputs[activeField as number] || '')

  return (
    <div className="h-dvh bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-safe-offset-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full ios-press"
        >
          <ArrowLeft className="w-[22px] h-[22px] text-foreground" strokeWidth={2.5} />
        </button>
        <h1 className="text-[20px] font-bold text-foreground tracking-tight">{'Para onde?'}</h1>
        {stops.length > 0 && (
          <span className="ml-auto text-[13px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
            {stops.length + 2} pontos
          </span>
        )}
      </div>

      {/* Route inputs */}
      <div className="px-4 pb-3 overflow-hidden">
        <div className="flex gap-3 overflow-hidden">
          {/* Route line indicators */}
          <div className="flex flex-col items-center pt-4 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <div className="w-[2px] flex-1 bg-blue-200 dark:bg-blue-800 my-1" />
            {stops.map((_, i) => (
              <div key={`line-${i}`} className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-[2px] flex-1 bg-amber-200 dark:bg-amber-800 my-1" style={{ minHeight: 32 }} />
              </div>
            ))}
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          </div>

          {/* Input fields */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Current location (read-only) */}
            <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3">
              <Navigation className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={2.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-blue-500 uppercase tracking-wide">{'Local atual'}</p>
                <p className="text-[15px] text-foreground truncate mt-0.5">
                  {loadingLocation ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {'Buscando...'}
                    </span>
                  ) : (
                    currentAddress
                  )}
                </p>
              </div>
            </div>

            {/* Intermediate stops */}
            {stops.map((stop, i) => (
              <div
                key={`stop-${i}`}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                  activeField === i
                    ? 'bg-secondary border-2 border-amber-500'
                    : stop.address
                      ? 'bg-secondary border-2 border-transparent'
                      : 'bg-secondary border-2 border-amber-300/50'
                }`}
              >
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Parada {i + 1}
                  </p>
                  <input
                    ref={(el) => { stopInputRefs.current[i] = el }}
                    type="text"
                    placeholder="Endereco da parada"
                    value={stopInputs[i] || ''}
                    onChange={(e) => handleInputChange(e.target.value, i)}
                    onFocus={() => setActiveField(i)}
                    className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground mt-0.5"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStop(i)}
                  className="w-7 h-7 bg-muted rounded-full flex items-center justify-center shrink-0 ios-press"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
                </button>
              </div>
            ))}

            {/* Destination input */}
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
              activeField === 'destination'
                ? 'bg-secondary border-2 border-blue-500'
                : 'bg-secondary border-2 border-transparent'
            }`}>
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" strokeWidth={2.5} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">{'Destino final'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Para onde voce vai?"
                    value={destination}
                    onChange={(e) => handleInputChange(e.target.value, 'destination')}
                    onFocus={() => setActiveField('destination')}
                    className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  {destination && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestination('')
                        setPredictions([])
                        inputRef.current?.focus()
                      }}
                      className="shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center ios-press"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Add stop button */}
            {stops.length < MAX_STOPS && (
              <button
                type="button"
                onClick={addStop}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 ios-press transition-colors"
              >
                <Plus className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
                <span className="text-[14px] font-semibold text-blue-500">Adicionar parada</span>
                <span className="ml-auto text-[12px] text-muted-foreground">{MAX_STOPS - stops.length} restantes</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />

      {/* Results */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        {loadingPredictions && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        )}

        {!loadingPredictions && predictions.length > 0 && (
          <div className="px-4 py-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 py-2">
              {activeField === 'destination' ? 'Resultados para destino' : `Resultados para parada ${(activeField as number) + 1}`}
            </p>
            {predictions.map((prediction, i) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPlace(prediction)}
                className={`w-full flex items-start gap-3.5 py-3.5 text-left ios-press px-1 ${i < predictions.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 mt-0.5 ${
                  prediction.isFromHistory 
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : activeField === 'destination' 
                      ? 'bg-orange-50 dark:bg-orange-900/20' 
                      : 'bg-amber-50 dark:bg-amber-900/20'
                }`}>
                  {prediction.isFromHistory ? (
                    <Clock className="w-[18px] h-[18px] text-blue-500" strokeWidth={2} />
                  ) : (
                    <MapPin className={`w-[18px] h-[18px] ${
                      activeField === 'destination' ? 'text-orange-500' : 'text-amber-500'
                    }`} strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-foreground truncate flex-1">
                      {prediction.structured_formatting?.main_text || prediction.description}
                    </p>
                    {prediction.isFromHistory && prediction.searchCount && prediction.searchCount > 2 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full shrink-0">
                        <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                        {prediction.searchCount}x
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                    {prediction.structured_formatting?.secondary_text || ''}
                  </p>
                </div>
                <svg className="w-5 h-5 text-muted-foreground/40 mt-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {!loadingPredictions && activeQuery.length >= 3 && predictions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
            <p className="text-[17px] font-medium text-foreground text-center">{'Nenhum resultado'}</p>
            <p className="text-[15px] text-muted-foreground text-center mt-1">{'Tente digitar outro endereco'}</p>
          </div>
        )}

        {!loadingPredictions && activeQuery.length < 3 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mb-3" strokeWidth={1.5} />
            <p className="text-[15px] text-muted-foreground text-center">{'Digite o endereco de destino'}</p>
            {stops.length === 0 && (
              <p className="text-[13px] text-muted-foreground/60 text-center mt-2">
                {'Voce pode adicionar ate 3 paradas intermediarias'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
