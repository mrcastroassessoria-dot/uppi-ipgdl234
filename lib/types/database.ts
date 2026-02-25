export type UserType = 'passenger' | 'driver' | 'both'
export type RideStatus = 'pending' | 'negotiating' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'wallet'
export type VehicleType = 'economy' | 'electric' | 'premium' | 'suv' | 'moto'

export interface Profile {
  id: string
  full_name: string
  phone: string
  avatar_url?: string
  user_type: UserType
  rating: number
  total_rides: number
  created_at: string
  updated_at: string
}

export interface DriverProfile {
  id: string
  license_number: string
  vehicle_type: VehicleType
  vehicle_brand: string
  vehicle_model: string
  vehicle_year: number
  vehicle_plate: string
  vehicle_color: string
  is_verified: boolean
  is_available: boolean
  current_location?: {
    type: 'Point'
    coordinates: [number, number]
  }
  created_at: string
  updated_at: string
}

export interface Ride {
  id: string
  passenger_id: string
  driver_id?: string
  vehicle_type?: VehicleType
  pickup_lat?: number
  pickup_lng?: number
  pickup_address: string
  dropoff_lat?: number
  dropoff_lng?: number
  dropoff_address: string
  distance_km?: number
  estimated_duration_minutes?: number
  passenger_price_offer?: number
  final_price?: number
  payment_method?: PaymentMethod
  status: RideStatus
  scheduled_time?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PriceOffer {
  id: string
  ride_id: string
  driver_id: string
  offered_price: number
  message?: string
  status: OfferStatus
  expires_at: string
  created_at: string
  updated_at: string
  driver?: Profile & { driver_profile?: DriverProfile }
}

export interface Rating {
  id: string
  ride_id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  comment?: string
  tags?: string[]
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  data?: any
  read: boolean
  created_at: string
}
