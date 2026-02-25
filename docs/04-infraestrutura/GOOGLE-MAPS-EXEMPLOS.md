# Google Maps - Exemplos Praticos

**Ultima Atualizacao:** 24/02/2026

> Setup e configuracao base: ver GOOGLE-MAPS.md

---

## 1. Mapa com Localizacao do Usuario

```tsx
"use client"

import { useRef } from 'react'
import { GoogleMap, GoogleMapHandle } from '@/components/google-map'
import { Button } from '@/components/ui/button'
import { Navigation } from 'lucide-react'

export function MapaBasico() {
  const mapRef = useRef<GoogleMapHandle>(null)

  return (
    <div className="relative w-full h-[400px]">
      <GoogleMap
        ref={mapRef}
        onLocationFound={(lat, lng) => {
          console.log('Localizacao:', lat, lng)
        }}
        className="w-full h-full rounded-xl"
      />

      <Button
        size="icon"
        className="absolute bottom-4 right-4"
        onClick={() => mapRef.current?.centerOnUser()}
      >
        <Navigation className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

---

## 2. Mapa com Rota entre Dois Pontos

```tsx
"use client"

import { RouteMap } from '@/components/route-map'

export function MapaComRota() {
  const origem = { lat: -23.5505, lng: -46.6333 } // Av Paulista
  const destino = { lat: -23.5629, lng: -46.6544 } // Rua Augusta

  return (
    <RouteMap
      origin={origem}
      destination={destino}
      originLabel="Av Paulista"
      destinationLabel="Rua Augusta"
      showInfoWindows={true}
      className="w-full h-[400px] rounded-xl"
    />
  )
}
```

---

## 3. Busca de Endereco com Autocomplete

```tsx
"use client"

import { useState } from 'react'
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'

export function BuscaEndereco() {
  const [endereco, setEndereco] = useState('')
  const { predictions, getPlacePredictions, getPlaceDetails } =
    usePlacesAutocomplete()

  const handleSearch = (value: string) => {
    setEndereco(value)
    if (value.length > 2) {
      getPlacePredictions(value)
    }
  }

  const handleSelect = async (placeId: string, description: string) => {
    setEndereco(description)
    const details = await getPlaceDetails(placeId)
    if (details) {
      console.log('Selecionado:', {
        endereco: details.name,
        lat: details.geometry.location.lat(),
        lng: details.geometry.location.lng()
      })
    }
  }

  return (
    <div className="relative">
      <Input
        value={endereco}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Digite o endereco..."
      />

      {predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-background border rounded-lg mt-1 shadow-lg z-50">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p.place_id, p.description)}
              className="flex items-center gap-3 w-full p-3 hover:bg-muted text-left"
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 4. Motoristas Proximos em Tempo Real

```tsx
"use client"

import { useEffect, useState } from 'react'
import { useGoogleMaps } from '@/hooks/use-google-maps'
import { createClient } from '@/lib/supabase/client'

interface Driver {
  id: string
  full_name: string
  lat: number
  lng: number
  vehicle_type: string
  rating: number
  distance_meters: number
}

export function MotoristasProximos() {
  const { userLocation } = useGoogleMaps()
  const [drivers, setDrivers] = useState<Driver[]>([])

  // Busca inicial via API
  useEffect(() => {
    if (!userLocation) return

    fetch(`/api/drivers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`)
      .then(res => res.json())
      .then(data => setDrivers(data.drivers || []))
  }, [userLocation])

  // Supabase Realtime para updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('driver-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_profiles',
          filter: 'is_available=eq.true'
        },
        (payload) => {
          console.log('Motorista atualizado:', payload.new)
          // Atualizar lista de motoristas
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {drivers.length} motoristas proximos
      </p>
      {drivers.map(driver => (
        <div key={driver.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          <div>
            <p className="font-medium">{driver.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {driver.vehicle_type} - {(driver.distance_meters / 1000).toFixed(1)} km
            </p>
          </div>
          <span className="ml-auto text-sm">{driver.rating}</span>
        </div>
      ))}
    </div>
  )
}
```

---

## 5. Calculo de Distancia e Preco

```tsx
"use client"

import {
  calculateDistance,
  formatDistance,
  estimateDuration,
  formatDuration
} from '@/lib/google-maps/utils'
import { estimatePrice, formatCurrency } from '@/lib/utils/ride-calculator'

export function CalculoDistancia() {
  const origem = { lat: -23.5505, lng: -46.6333 }
  const destino = { lat: -23.5629, lng: -46.6544 }

  // Distancia em km (Haversine)
  const distanciaKm = calculateDistance(origem, destino)

  // Duracao estimada
  const duracaoMin = estimateDuration(distanciaKm)

  // Preco por tipo de veiculo
  const precos = {
    moto: estimatePrice(distanciaKm, 'moto'),
    economy: estimatePrice(distanciaKm, 'economy'),
    electric: estimatePrice(distanciaKm, 'electric'),
    premium: estimatePrice(distanciaKm, 'premium'),
    suv: estimatePrice(distanciaKm, 'suv'),
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <p>Distancia: {formatDistance(distanciaKm)}</p>
        <p>Duracao: {formatDuration(duracaoMin)}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Precos estimados:</h3>
        {Object.entries(precos).map(([tipo, preco]) => (
          <div key={tipo} className="flex justify-between">
            <span className="capitalize">{tipo}</span>
            <span>{formatCurrency(preco)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 6. Geocoding (Endereco para Coordenadas)

```tsx
// Via API (server-side com Google Geocoding API)
const response = await fetch('/api/geocode?address=Av+Paulista+1000+SP')
const data = await response.json()
// { lat: -23.5505, lng: -46.6333, formatted_address: "..." }
```

```tsx
// Via Places API (client-side com autocomplete)
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete'

const { getPlaceDetails } = usePlacesAutocomplete()
const details = await getPlaceDetails('ChIJ...')
const lat = details.geometry.location.lat()
const lng = details.geometry.location.lng()
```

---

## 7. Rotas Alternativas

```tsx
"use client"

import { useState, useEffect } from 'react'

interface RouteOption {
  distance: string
  duration: string
  price: number
  summary: string
}

export function RotasAlternativas() {
  const [routes, setRoutes] = useState<RouteOption[]>([])

  useEffect(() => {
    const params = new URLSearchParams({
      origin_lat: '-23.5505',
      origin_lng: '-46.6333',
      dest_lat: '-23.5629',
      dest_lng: '-46.6544',
    })

    fetch(`/api/routes/alternatives?${params}`)
      .then(res => res.json())
      .then(data => setRoutes(data.routes || []))
  }, [])

  return (
    <div className="space-y-3">
      {routes.map((route, i) => (
        <div
          key={i}
          className="p-4 border rounded-xl cursor-pointer hover:border-primary"
        >
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{route.summary}</p>
              <p className="text-sm text-muted-foreground">
                {route.distance} - {route.duration}
              </p>
            </div>
            <span className="font-bold">
              R$ {route.price.toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 8. Heatmap de Demanda (Motorista)

```tsx
"use client"

import { useState, useEffect } from 'react'
import { useGoogleMaps } from '@/hooks/use-google-maps'

interface HotZone {
  lat: number
  lng: number
  ride_count: number
  zone_status: 'hot' | 'warm' | 'cold'
  avg_price: number
}

export function HeatmapDemanda() {
  const { userLocation } = useGoogleMaps()
  const [zones, setZones] = useState<HotZone[]>([])

  useEffect(() => {
    if (!userLocation) return

    fetch(`/api/drivers/hot-zones?lat=${userLocation.lat}&lng=${userLocation.lng}`)
      .then(res => res.json())
      .then(data => setZones(data.zones || []))
  }, [userLocation])

  const coresZona = {
    hot: 'bg-red-500/20 border-red-500',
    warm: 'bg-amber-500/20 border-amber-500',
    cold: 'bg-blue-500/20 border-blue-500',
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Zonas Quentes</h3>
      {zones.map((zone, i) => (
        <div
          key={i}
          className={`p-3 rounded-lg border ${coresZona[zone.zone_status]}`}
        >
          <div className="flex justify-between">
            <span>{zone.ride_count} corridas/h</span>
            <span>R$ {zone.avg_price.toFixed(2)} medio</span>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 9. Map Fallback (Quando API Falha)

```tsx
"use client"

import { MapFallback } from '@/components/map-fallback'
import { GoogleMap } from '@/components/google-map'
import { useGoogleMaps } from '@/hooks/use-google-maps'

export function MapaComFallback() {
  const { error } = useGoogleMaps()

  if (error) {
    return (
      <MapFallback
        message="Nao foi possivel carregar o mapa"
        showRetry
        onRetry={() => window.location.reload()}
      />
    )
  }

  return <GoogleMap className="w-full h-[400px]" />
}
```

---

## 10. Componente PlacesSearch Completo

```tsx
"use client"

import { PlacesSearch } from '@/components/places-search'

export function ExemploPlacesSearch() {
  return (
    <PlacesSearch
      placeholder="Para onde?"
      onPlaceSelect={(place) => {
        console.log('Local selecionado:', {
          nome: place.name,
          endereco: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      }}
    />
  )
}
```

---

## APIs Google Maps Usadas

| API | Uso no Projeto | Endpoint |
|-----|---------------|----------|
| Maps JavaScript API | Renderizar mapas | Client-side |
| Places API | Autocomplete, detalhes | `/api/places/*` |
| Directions API | Rotas, alternativas | `/api/routes/alternatives` |
| Geocoding API | Endereco -> coordenadas | `/api/geocode` |
| Distance Matrix API | Calculo de distancia | `/api/distance` |

---

## Restricoes e Limites

| API | Limite Gratuito | Custo Apos |
|-----|----------------|------------|
| Maps JavaScript | 28.000 loads/mes | $7/1000 |
| Places Autocomplete | 2.500 req/dia | $2.83/1000 |
| Directions | 2.500 req/dia | $5/1000 |
| Geocoding | 2.500 req/dia | $5/1000 |
| Distance Matrix | 2.500 req/dia | $5/1000 |

> Google da $200/mes de credito gratuito que cobre a maioria dos casos.

---

> Setup completo e troubleshooting: ver GOOGLE-MAPS.md
> Documentacao da lib: ver lib/google-maps/README.md
