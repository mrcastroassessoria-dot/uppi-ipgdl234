// AI-powered destination suggestions based on user patterns
// Uses historical data, time, day of week, and location patterns

export interface DestinationSuggestion {
  address: string
  label: string
  icon: string
  color: string
  confidence: number
  reason: string
  estimatedPrice?: { min: number; max: number }
  estimatedMinutes?: number
}

export interface PriceEstimate {
  min: number
  max: number
  average: number
  trend: 'normal' | 'high' | 'low'
  recommendation: string
  percentDiff: number // how much above/below normal
  bestTimeToRide?: string
}

export interface PriceAlert {
  type: 'high' | 'low' | 'normal'
  message: string
  detail: string
  tip?: string
}

// Analyze ride patterns and suggest destinations
export function generateSmartSuggestions(
  rides: Array<{
    dropoff_address: string
    pickup_address?: string
    created_at: string
    final_price?: number
    distance_km?: number
    estimated_duration_minutes?: number
  }>,
  currentLocation?: { lat: number; lng: number }
): DestinationSuggestion[] {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isWeekday = !isWeekend

  const isMorning = hour >= 6 && hour < 12
  const isAfternoon = hour >= 12 && hour < 18
  const isEvening = hour >= 18 && hour < 22
  const isNight = hour >= 22 || hour < 6

  const addressFrequency = new Map<string, {
    count: number
    hours: number[]
    days: number[]
    prices: number[]
    distances: number[]
    durations: number[]
  }>()

  rides.forEach(ride => {
    const rideDate = new Date(ride.created_at)
    const rideHour = rideDate.getHours()
    const rideDay = rideDate.getDay()

    const current = addressFrequency.get(ride.dropoff_address) || {
      count: 0, hours: [], days: [], prices: [], distances: [], durations: [],
    }

    addressFrequency.set(ride.dropoff_address, {
      count: current.count + 1,
      hours: [...current.hours, rideHour],
      days: [...current.days, rideDay],
      prices: ride.final_price ? [...current.prices, ride.final_price] : current.prices,
      distances: ride.distance_km ? [...current.distances, ride.distance_km] : current.distances,
      durations: ride.estimated_duration_minutes ? [...current.durations, ride.estimated_duration_minutes] : current.durations,
    })
  })

  const suggestions: DestinationSuggestion[] = []

  addressFrequency.forEach((data, address) => {
    const hourMatches = data.hours.filter(h => Math.abs(h - hour) <= 2).length
    const dayTypeMatches = data.days.filter(d => {
      const isDayWeekend = d === 0 || d === 6
      return isWeekend ? isDayWeekend : !isDayWeekend
    }).length

    const timeRelevance = hourMatches / data.hours.length
    const dayRelevance = dayTypeMatches / data.days.length
    const frequencyScore = data.count / rides.length

    const confidence = (timeRelevance * 0.4 + dayRelevance * 0.3 + frequencyScore * 0.3) * 100

    if (confidence > 15) {
      let label = 'Destino frequente'
      let icon = 'map-pin'
      let color = 'text-[#34C759]'
      let reason = 'Voce vai aqui frequentemente'

      if (isMorning) {
        const morningRides = data.hours.filter(h => h >= 6 && h < 12).length
        if (morningRides > data.hours.length * 0.5) {
          if (isWeekday) {
            label = 'Trabalho'
            icon = 'briefcase'
            color = 'text-[#FF9500]'
            reason = 'Voce costuma ir aqui de manha em dias uteis'
          } else {
            label = 'Lazer matinal'
            icon = 'coffee'
            color = 'text-[#FF9500]'
            reason = 'Destino frequente nas manhas de fds'
          }
        }
      }

      if (isAfternoon) {
        const afternoonRides = data.hours.filter(h => h >= 12 && h < 18).length
        if (afternoonRides > data.hours.length * 0.5) {
          label = 'Rotina da tarde'
          icon = 'coffee'
          color = 'text-[#FF9500]'
          reason = 'Destino comum neste horario'
        }
      }

      if (isEvening || isNight) {
        const eveningRides = data.hours.filter(h => h >= 18).length
        if (eveningRides > data.hours.length * 0.5) {
          label = 'Casa'
          icon = 'home'
          color = 'text-[#007AFF]'
          reason = 'Voce costuma voltar aqui a noite'
        }
      }

      if (isWeekend) {
        const weekendRides = data.days.filter(d => d === 0 || d === 6).length
        if (weekendRides > data.days.length * 0.7) {
          label = 'Fim de semana'
          icon = 'star'
          color = 'text-[#FF2D55]'
          reason = 'Destino tipico de fim de semana'
        }
      }

      // Price range from historical data
      let estimatedPrice: { min: number; max: number } | undefined
      if (data.prices.length >= 2) {
        const sorted = [...data.prices].sort((a, b) => a - b)
        estimatedPrice = {
          min: sorted[Math.floor(sorted.length * 0.25)] ?? sorted[0],
          max: sorted[Math.floor(sorted.length * 0.75)] ?? sorted[sorted.length - 1],
        }
      } else if (data.prices.length === 1) {
        estimatedPrice = {
          min: data.prices[0] * 0.85,
          max: data.prices[0] * 1.15,
        }
      }

      // Average duration
      let estimatedMinutes: number | undefined
      if (data.durations.length > 0) {
        estimatedMinutes = Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length)
      }

      suggestions.push({
        address,
        label,
        icon,
        color,
        confidence: Math.round(Math.min(confidence, 98)),
        reason,
        estimatedPrice,
        estimatedMinutes,
      })
    }
  })

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 4)
}

// Estimate price with AI insights
export function estimatePriceWithContext(
  distanceKm: number,
  rides: Array<{ distance_km?: number; final_price?: number; created_at: string }>,
  currentHour: number = new Date().getHours(),
  dayOfWeek: number = new Date().getDay()
): PriceEstimate {
  const baseFare = 5.0
  const pricePerKm = 2.5
  const basePrice = baseFare + distanceKm * pricePerKm

  const similarRides = rides.filter(
    r => r.distance_km && Math.abs(r.distance_km - distanceKm) < distanceKm * 0.3
  )

  if (similarRides.length === 0) {
    return {
      min: basePrice * 0.8,
      max: basePrice * 1.2,
      average: basePrice,
      trend: 'normal',
      percentDiff: 0,
      recommendation: 'Preco estimado baseado na distancia',
    }
  }

  const prices = similarRides.filter(r => r.final_price).map(r => r.final_price!)
  const avgHistorical = prices.reduce((a, b) => a + b, 0) / prices.length
  const minHistorical = Math.min(...prices)
  const maxHistorical = Math.max(...prices)

  const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isLateNight = currentHour >= 22 || currentHour < 6
  const isOffPeak = currentHour >= 10 && currentHour < 16

  let trendMultiplier = 1.0
  let trend: 'normal' | 'high' | 'low' = 'normal'
  let recommendation = 'Bom momento para solicitar'
  let bestTimeToRide: string | undefined

  if (isRushHour && !isWeekend) {
    trendMultiplier = 1.15
    trend = 'high'
    recommendation = 'Preco ~15% acima do normal. Considere negociar mais.'
    bestTimeToRide = 'entre 10h e 16h'
  } else if (isLateNight) {
    trendMultiplier = 1.1
    trend = 'high'
    recommendation = 'Preco levemente acima devido ao horario noturno'
    bestTimeToRide = 'entre 10h e 16h'
  } else if (isOffPeak) {
    trendMultiplier = 0.92
    trend = 'low'
    recommendation = 'Otimo momento! Precos estao mais baixos agora'
  } else if (isWeekend && isOffPeak) {
    trendMultiplier = 0.9
    trend = 'low'
    recommendation = 'Fim de semana + fora do pico = precos otimos!'
  }

  const adjustedAvg = avgHistorical * trendMultiplier
  const percentDiff = Math.round((trendMultiplier - 1) * 100)

  return {
    min: minHistorical * 0.95,
    max: maxHistorical * 1.05,
    average: adjustedAvg,
    trend,
    percentDiff,
    recommendation,
    bestTimeToRide,
  }
}

// Generate price alert for current moment
export function generatePriceAlert(
  currentHour: number = new Date().getHours(),
  dayOfWeek: number = new Date().getDay()
): PriceAlert {
  const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isLateNight = currentHour >= 22 || currentHour < 6
  const isOffPeak = currentHour >= 10 && currentHour < 16

  if (isRushHour && !isWeekend) {
    return {
      type: 'high',
      message: 'Horario de pico',
      detail: 'Precos ~15% acima do normal agora',
      tip: 'Ofereca um valor mais baixo - motoristas costumam aceitar negociacao',
    }
  }

  if (isLateNight) {
    return {
      type: 'high',
      message: 'Horario noturno',
      detail: 'Precos ~10% acima do normal',
      tip: 'Menos motoristas disponiveis, considere um valor justo',
    }
  }

  if (isOffPeak) {
    return {
      type: 'low',
      message: 'Melhor horario!',
      detail: 'Precos estao ate 10% mais baixos agora',
      tip: 'Aproveite para fazer suas corridas neste horario',
    }
  }

  return {
    type: 'normal',
    message: 'Preco normal',
    detail: 'Sem variacao significativa de preco',
  }
}

// Generate contextual insights for the user
export function generateContextualInsights(
  totalRides: number,
  totalSpent: number,
  rides: Array<{ created_at: string; final_price?: number }>
): string[] {
  const insights: string[] = []
  const now = new Date()
  const hour = now.getHours()

  const avgSpending = totalSpent / Math.max(totalRides, 1)

  // Time-sensitive price tips
  if (hour >= 7 && hour <= 9) {
    insights.push('Corridas entre 10h-16h sao geralmente 10% mais baratas')
  } else if (hour >= 17 && hour <= 19) {
    insights.push('Pico da tarde! Negocie forte ou aguarde apos 20h')
  } else if (hour >= 10 && hour < 16) {
    insights.push('Otimo horario! Precos estao abaixo da media agora')
  }

  // Milestone celebrations
  if (totalRides >= 50) {
    insights.push(`${totalRides} corridas com Uppi! Voce ja economizou com negociacao`)
  } else if (totalRides >= 20) {
    insights.push(`Ja sao ${totalRides} corridas! Continue negociando`)
  } else if (totalRides >= 5) {
    insights.push(`${totalRides} corridas realizadas. Dica: negocie sempre!`)
  }

  // Weekly spending analysis
  const lastWeekRides = rides.filter(r => {
    const rideDate = new Date(r.created_at)
    const daysDiff = (now.getTime() - rideDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  })

  const weeklySpent = lastWeekRides.reduce((sum, r) => sum + (r.final_price || 0), 0)
  if (lastWeekRides.length >= 3 && weeklySpent > 0) {
    insights.push(`R$ ${weeklySpent.toFixed(0)} gastos esta semana em ${lastWeekRides.length} corridas`)
  }

  return insights.slice(0, 2)
}
