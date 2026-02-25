import { Location } from './utils'

export interface RouteOption {
  id: string
  distance: number // kilometers
  duration: number // minutes
  cost: number // estimated cost in BRL
  traffic: 'low' | 'medium' | 'high'
  routeType: 'fastest' | 'shortest' | 'economical' | 'scenic'
  waypoints: Location[]
  polyline?: string
  savings?: {
    time: number // minutes saved
    cost: number // money saved in BRL
    distance: number // km saved
  }
}

export interface OptimizationResult {
  recommended: RouteOption
  alternatives: RouteOption[]
  totalSavings: {
    time: number
    cost: number
    distance: number
  }
}

/**
 * Calculate route cost based on distance and traffic conditions
 */
export function calculateRouteCost(
  distance: number,
  traffic: 'low' | 'medium' | 'high'
): number {
  const basePricePerKm = 2.5 // R$ 2.50 per km base rate
  const trafficMultiplier = {
    low: 1.0,
    medium: 1.15,
    high: 1.35,
  }
  
  const cost = distance * basePricePerKm * trafficMultiplier[traffic]
  return Math.round(cost * 100) / 100
}

/**
 * Estimate traffic level based on time of day and day of week
 */
export function estimateTraffic(date: Date = new Date()): 'low' | 'medium' | 'high' {
  const hour = date.getHours()
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  
  // Weekend traffic
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    if (hour >= 10 && hour <= 20) return 'medium'
    return 'low'
  }
  
  // Weekday rush hours
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 'high'
  }
  
  // Weekday business hours
  if (hour >= 10 && hour <= 16) {
    return 'medium'
  }
  
  // Night/early morning
  return 'low'
}

/**
 * Optimize route using Google Maps Directions API
 */
export async function optimizeRoute(
  origin: Location,
  destination: Location,
  options?: {
    avoidTolls?: boolean
    avoidHighways?: boolean
    departureTime?: Date
  }
): Promise<OptimizationResult> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    // Fallback to basic calculation if no API key
    return generateFallbackRoutes(origin, destination, options?.departureTime)
  }

  try {
    // In a real implementation, this would call Google Directions API
    // For now, generate simulated optimized routes
    return generateOptimizedRoutes(origin, destination, options?.departureTime)
  } catch (error) {
    console.error('[v0] Route optimization error:', error)
    return generateFallbackRoutes(origin, destination, options?.departureTime)
  }
}

/**
 * Generate optimized route options (simulated for demo)
 */
function generateOptimizedRoutes(
  origin: Location,
  destination: Location,
  departureTime?: Date
): OptimizationResult {
  const date = departureTime || new Date()
  const currentTraffic = estimateTraffic(date)
  
  // Calculate base distance (straight line * 1.3 for road distance)
  const straightLineDistance = calculateDistance(origin, destination)
  const baseDistance = straightLineDistance * 1.3
  
  // Generate route options
  const fastest: RouteOption = {
    id: 'fastest',
    routeType: 'fastest',
    distance: baseDistance * 1.05,
    duration: estimateDuration(baseDistance * 1.05, currentTraffic === 'high' ? 25 : 35),
    traffic: currentTraffic,
    cost: calculateRouteCost(baseDistance * 1.05, currentTraffic),
    waypoints: [origin, destination],
  }
  
  const shortest: RouteOption = {
    id: 'shortest',
    routeType: 'shortest',
    distance: baseDistance * 0.95,
    duration: estimateDuration(baseDistance * 0.95, currentTraffic === 'high' ? 22 : 30),
    traffic: currentTraffic === 'high' ? 'high' : 'medium',
    cost: calculateRouteCost(baseDistance * 0.95, currentTraffic === 'high' ? 'high' : 'medium'),
    waypoints: [origin, destination],
  }
  
  const economical: RouteOption = {
    id: 'economical',
    routeType: 'economical',
    distance: baseDistance * 0.92,
    duration: estimateDuration(baseDistance * 0.92, 'low'),
    traffic: 'low',
    cost: calculateRouteCost(baseDistance * 0.92, 'low'),
    waypoints: [origin, destination],
  }
  
  // Calculate savings compared to standard route (fastest in high traffic)
  const standardCost = calculateRouteCost(baseDistance * 1.15, 'high')
  const standardDuration = estimateDuration(baseDistance * 1.15, 20)
  
  economical.savings = {
    time: standardDuration - economical.duration,
    cost: standardCost - economical.cost,
    distance: (baseDistance * 1.15) - economical.distance,
  }
  
  fastest.savings = {
    time: standardDuration - fastest.duration,
    cost: standardCost - fastest.cost,
    distance: (baseDistance * 1.15) - fastest.distance,
  }
  
  shortest.savings = {
    time: standardDuration - shortest.duration,
    cost: standardCost - shortest.cost,
    distance: (baseDistance * 1.15) - shortest.distance,
  }
  
  return {
    recommended: economical,
    alternatives: [fastest, shortest],
    totalSavings: {
      time: economical.savings.time,
      cost: economical.savings.cost,
      distance: economical.savings.distance,
    },
  }
}

/**
 * Fallback route calculation without API
 */
function generateFallbackRoutes(
  origin: Location,
  destination: Location,
  departureTime?: Date
): OptimizationResult {
  return generateOptimizedRoutes(origin, destination, departureTime)
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat)
  const dLng = toRad(point2.lng - point1.lng)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

function estimateDuration(km: number, avgSpeedKmh: number): number {
  return Math.round((km / avgSpeedKmh) * 60)
}

/**
 * Format currency for Brazil
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Get optimization benefits description
 */
export function getOptimizationBenefits(savings: OptimizationResult['totalSavings']) {
  const benefits = []
  
  if (savings.time > 0) {
    benefits.push(`Economia de ${Math.round(savings.time)} minutos`)
  }
  
  if (savings.cost > 0) {
    benefits.push(`Economia de ${formatCurrency(savings.cost)}`)
  }
  
  if (savings.distance > 0) {
    benefits.push(`${savings.distance.toFixed(1)} km a menos`)
  }
  
  return benefits
}
