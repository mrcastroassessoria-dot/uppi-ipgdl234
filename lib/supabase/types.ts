// Database Types for Uppi App

export type UserRole = 'passenger' | 'driver' | 'admin'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned'
export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type VehicleType = 'economy' | 'comfort' | 'premium' | 'suv' | 'van' | 'moto'
export type RideStatus = 'searching' | 'pending_offers' | 'accepted' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled' | 'failed'
export type RideType = 'individual' | 'shared' | 'scheduled' | 'delivery' | 'intercity'
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type TransactionType = 'ride' | 'refund' | 'bonus' | 'cashback' | 'referral' | 'subscription' | 'withdrawal' | 'deposit'
export type NotificationType = 'ride' | 'offer' | 'message' | 'achievement' | 'promotion' | 'system'

export interface User {
  id: string
  email: string
  phone?: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  status: UserStatus
  is_phone_verified: boolean
  is_email_verified: boolean
  fcm_token?: string
  referral_code?: string
  referred_by?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  date_of_birth?: string
  gender?: string
  cpf?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  user_id: string
  status: DriverStatus
  license_number: string
  license_category: string
  license_expiry?: string
  license_photo_url?: string
  cpf: string
  rg?: string
  date_of_birth?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  bank_name?: string
  bank_account?: string
  bank_agency?: string
  pix_key?: string
  selfie_photo_url?: string
  background_check_status: string
  is_online: boolean
  current_location?: string
  last_location_update?: string
  rating: number
  total_rides: number
  total_earnings: number
  availability: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  driver_id: string
  type: VehicleType
  make: string
  model: string
  year: number
  color: string
  license_plate: string
  registration_number?: string
  registration_photo_url?: string
  insurance_policy?: string
  insurance_expiry?: string
  insurance_photo_url?: string
  photo_url?: string
  seats: number
  is_active: boolean
  features: string[]
  created_at: string
  updated_at: string
}

export interface Ride {
  id: string
  passenger_id: string
  driver_id?: string
  vehicle_id?: string
  status: RideStatus
  type: RideType
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  distance_km?: number
  duration_minutes?: number
  estimated_price?: number
  final_price?: number
  payment_method?: string
  payment_status: PaymentStatus
  scheduled_at?: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  cancelled_by?: string
  notes?: string
  route_polyline?: string
  stops: any[]
  is_shared: boolean
  max_passengers: number
  current_passengers: number
  promo_code?: string
  discount_amount: number
  created_at: string
  updated_at: string
}

export interface RideOffer {
  id: string
  ride_id: string
  driver_id: string
  vehicle_id: string
  status: OfferStatus
  offered_price: number
  estimated_arrival_minutes?: number
  message?: string
  expires_at: string
  accepted_at?: string
  rejected_at?: string
  created_at: string
}

export interface Message {
  id: string
  ride_id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface Review {
  id: string
  ride_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  tags: string[]
  is_driver_review: boolean
  created_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_after: number
  description?: string
  reference_id?: string
  reference_type?: string
  metadata: Record<string, any>
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_ride_value?: number
  max_discount?: number
  usage_limit?: number
  usage_count: number
  user_usage_limit: number
  valid_from: string
  valid_until?: string
  is_active: boolean
  applicable_to: Record<string, any>
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  name: string
  address: string
  lat: number
  lng: number
  type?: 'home' | 'work' | 'other'
  icon?: string
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  name: string
  description?: string
  icon?: string
  type: string
  requirement_value?: number
  points: number
  badge_image_url?: string
  is_active: boolean
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  progress: number
  is_completed: boolean
  completed_at?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, any>
  is_read: boolean
  read_at?: string
  action_url?: string
  created_at: string
}

export interface SocialPost {
  id: string
  user_id: string
  content: string
  image_url?: string
  likes_count: number
  comments_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface EmergencyContact {
  id: string
  user_id: string
  name: string
  phone: string
  relationship?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_name: string
  plan_price: number
  billing_cycle: 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'expired' | 'paused'
  benefits: any[]
  started_at: string
  expires_at: string
  cancelled_at?: string
  auto_renew: boolean
  payment_method?: string
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  title: string
  description?: string
  image_url?: string
  promo_type: 'discount' | 'cashback' | 'bonus' | 'free_rides'
  value?: number
  target_audience: Record<string, any>
  valid_from: string
  valid_until?: string
  max_usage?: number
  current_usage: number
  is_active: boolean
  created_at: string
}

export interface HotZone {
  id: string
  name: string
  radius_km: number
  surge_multiplier: number
  is_active: boolean
  active_from?: string
  active_until?: string
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  id: string
  user_id: string
  period: 'weekly' | 'monthly' | 'all_time'
  points: number
  rank?: number
  total_rides: number
  total_distance_km: number
  created_at: string
  updated_at: string
}
