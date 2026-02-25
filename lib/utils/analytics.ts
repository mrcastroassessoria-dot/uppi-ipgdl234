/**
 * Analytics Utility for UPPI
 * Tracks key user events for product decisions
 */

import { track } from '@vercel/analytics'

// Event types
export type AnalyticsEvent =
  // User events
  | 'user_signup'
  | 'user_login'
  | 'profile_updated'
  
  // Ride events
  | 'ride_requested'
  | 'ride_cancelled'
  | 'offer_made'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'ride_started'
  | 'ride_completed'
  | 'ride_rated'
  
  // Driver events
  | 'driver_signup'
  | 'driver_verified'
  | 'driver_online'
  | 'driver_offline'
  
  // Payment events
  | 'payment_method_added'
  | 'payment_completed'
  | 'pix_generated'
  
  // Social events
  | 'post_created'
  | 'post_liked'
  | 'comment_added'
  
  // Engagement
  | 'coupon_applied'
  | 'referral_sent'
  | 'emergency_contact_added'
  | 'notification_enabled'

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined
}

/**
 * Track an analytics event
 * Automatically includes user context if available
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
) {
  // Only track in production or if explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) {
    console.log('[v0] Analytics (dev):', event, properties)
    return
  }

  try {
    track(event, properties)
  } catch (error) {
    console.error('[v0] Analytics error:', error)
  }
}

/**
 * Track ride request with details
 */
export function trackRideRequest(data: {
  origin: string
  destination: string
  distance_km: number
  vehicle_type: string
}) {
  trackEvent('ride_requested', {
    vehicle_type: data.vehicle_type,
    distance_km: data.distance_km,
    has_origin: !!data.origin,
    has_destination: !!data.destination,
  })
}

/**
 * Track offer acceptance
 */
export function trackOfferAccepted(data: {
  ride_id: string
  offer_amount: number
  driver_rating: number
  time_to_accept_seconds: number
}) {
  trackEvent('offer_accepted', {
    offer_amount: data.offer_amount,
    driver_rating: data.driver_rating,
    acceptance_time: data.time_to_accept_seconds,
  })
}

/**
 * Track payment completion
 */
export function trackPaymentCompleted(data: {
  amount: number
  method: 'pix' | 'card' | 'wallet'
  ride_id: string
}) {
  trackEvent('payment_completed', {
    amount: data.amount,
    payment_method: data.method,
  })
}

/**
 * Track user signup
 */
export function trackSignup(data: {
  method: 'phone' | 'email' | 'google'
}) {
  trackEvent('user_signup', {
    signup_method: data.method,
  })
}

/**
 * Track driver conversion
 */
export function trackDriverSignup(data: {
  vehicle_type: string
}) {
  trackEvent('driver_signup', {
    vehicle_type: data.vehicle_type,
  })
}

/**
 * Track notification permission
 */
export function trackNotificationPermission(granted: boolean) {
  trackEvent('notification_enabled', {
    permission_granted: granted,
  })
}

/**
 * Track coupon usage
 */
export function trackCouponApplied(data: {
  code: string
  discount_amount: number
  ride_id: string
}) {
  trackEvent('coupon_applied', {
    discount_amount: data.discount_amount,
  })
}
