# Google Maps Integration

**Ultima Atualizacao:** 24/02/2026
**Versao:** 11.0

Esta pasta contém a integração do Google Maps para o aplicativo de carona.

## Configuração

### Variáveis de Ambiente

A seguinte variável de ambiente é necessária:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

### APIs Necessárias

Certifique-se de habilitar as seguintes APIs no Google Cloud Console:

1. **Maps JavaScript API** - Para exibir mapas
2. **Places API** - Para busca de endereços e autocomplete
3. **Directions API** - Para calcular rotas
4. **Geocoding API** - Para converter endereços em coordenadas

## Uso

### 1. Provider

Envolva sua aplicação com o `GoogleMapsProvider`:

```tsx
import { GoogleMapsProvider } from '@/lib/google-maps/provider'

export default function Layout({ children }) {
  return (
    <GoogleMapsProvider>
      {children}
    </GoogleMapsProvider>
  )
}
```

### 2. Hooks

#### useGoogleMaps

Hook para obter a localização do usuário:

```tsx
import { useGoogleMaps } from '@/hooks/use-google-maps'

function MyComponent() {
  const { userLocation, loading, error, requestLocation } = useGoogleMaps()

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      Localização: {userLocation?.lat}, {userLocation?.lng}
      <button onClick={requestLocation}>Atualizar</button>
    </div>
  )
}
```

#### usePlacesAutocomplete

Hook para buscar lugares com autocomplete:

```tsx
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete'

function SearchBox() {
  const { predictions, getPlacePredictions, getPlaceDetails } = usePlacesAutocomplete()

  const handleSearch = (value: string) => {
    getPlacePredictions(value)
  }

  const handleSelect = async (placeId: string) => {
    const details = await getPlaceDetails(placeId)
    console.log(details)
  }

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {predictions.map((p) => (
        <div key={p.place_id} onClick={() => handleSelect(p.place_id)}>
          {p.description}
        </div>
      ))}
    </div>
  )
}
```

### 3. Componentes Existentes

#### GoogleMap

Componente de mapa interativo com localização do usuário:

```tsx
import { GoogleMap } from '@/components/google-map'

function MyPage() {
  const mapRef = useRef<GoogleMapHandle>(null)

  return (
    <>
      <GoogleMap
        ref={mapRef}
        onLocationFound={(lat, lng) => console.log(lat, lng)}
        className="w-full h-full"
      />
      <button onClick={() => mapRef.current?.centerOnUser()}>
        Centralizar
      </button>
    </>
  )
}
```

#### RouteMap

Componente de mapa mostrando rota entre dois pontos:

```tsx
import { RouteMap } from '@/components/route-map'

function RoutePage() {
  return (
    <RouteMap
      origin={{ lat: -23.5505, lng: -46.6333 }}
      destination={{ lat: -23.5629, lng: -46.6544 }}
      originLabel="Origem"
      destinationLabel="Destino"
      showInfoWindows={true}
      className="w-full h-[400px]"
    />
  )
}
```

### 4. Utilitários

A biblioteca `utils.ts` fornece funções auxiliares:

```tsx
import {
  calculateDistance,
  formatDistance,
  estimateDuration,
  formatDuration,
  getCurrentLocation
} from '@/lib/google-maps/utils'

// Calcular distância
const km = calculateDistance(
  { lat: -23.5505, lng: -46.6333 },
  { lat: -23.5629, lng: -46.6544 }
)
console.log(formatDistance(km)) // "1.5 km"

// Estimar duração
const minutes = estimateDuration(km)
console.log(formatDuration(minutes)) // "3 min"

// Obter localização atual
const location = await getCurrentLocation()
```

## Segurança

- A chave da API deve ter o prefixo `NEXT_PUBLIC_` para ser acessível no cliente
- Configure restrições de domínio no Google Cloud Console
- Limite as APIs habilitadas apenas às necessárias
- Considere usar backend proxy para chamadas sensíveis da API

## Troubleshooting

### Mapa não carrega

1. Verifique se `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` está configurada
2. Verifique se as APIs necessárias estão habilitadas no Console
3. Verifique o console do browser para erros

### Autocomplete não funciona

1. Certifique-se de que a **Places API** está habilitada
2. Verifique se o componente está dentro do `GoogleMapsProvider`
3. Verifique a cota de requisições da API

### Erro de permissão de localização

1. O usuário precisa permitir acesso à localização no navegador
2. HTTPS é necessário para geolocalização (exceto localhost)
