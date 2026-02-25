/**
 * Google Maps Integration Types
 */

export interface Location {
  lat: number
  lng: number
}

export interface PlaceResult {
  placeId: string
  name: string
  address: string
  location: Location
}

export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export interface RouteInfo {
  origin: Location
  destination: Location
  distance: number // in kilometers
  duration: number // in minutes
  polyline?: string
}

export interface MapMarker {
  id: string
  position: Location
  label?: string
  icon?: string
  onClick?: () => void
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'loading'

export type MapStyle = 'standard' | 'silver' | 'retro' | 'dark' | 'night' | 'aubergine'

export interface GeocodeResult {
  formatted_address: string
  place_id: string
  types: string[]
  geometry: {
    location: Location
    location_type: string
  }
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

export interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: {
        text: string
        value: number
      }
      duration: {
        text: string
        value: number
      }
      start_address: string
      end_address: string
      start_location: Location
      end_location: Location
      steps: Array<{
        distance: {
          text: string
          value: number
        }
        duration: {
          text: string
          value: number
        }
        start_location: Location
        end_location: Location
        instructions: string
        travel_mode: string
      }>
    }>
    overview_polyline: {
      points: string
    }
    bounds: MapBounds
    warnings: string[]
  }>
  status: string
}

// Ride-specific types for the app
export interface RideLocation {
  address: string
  location: Location
  placeId?: string
}

export interface RideRequest {
  origin: RideLocation
  destination: RideLocation
  distance?: number
  estimatedDuration?: number
  estimatedPrice?: number
}

export interface Driver {
  id: string
  name: string
  rating: number
  vehicle: {
    model: string
    plate: string
    color: string
  }
  currentLocation: Location
}

export interface ActiveRide {
  id: string
  status: 'searching' | 'accepted' | 'picking_up' | 'in_progress' | 'completed' | 'cancelled'
  origin: RideLocation
  destination: RideLocation
  driver?: Driver
  distance: number
  duration: number
  price: number
  createdAt: string
  updatedAt: string
}
