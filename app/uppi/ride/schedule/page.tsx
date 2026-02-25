'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { triggerHaptic } from '@/hooks/use-haptic'
import { iosToast } from '@/lib/utils/ios-toast'
import { scheduledRideSchema, validateForm } from '@/lib/validations/schemas'

interface RouteData {
  pickup: string
  destination: string
  pickupCoords: { lat: number; lng: number } | null
  destinationCoords: { lat: number; lng: number } | null
}

interface SelectedRide {
  price: number
  vehicleType: string
  paymentMethod: string
  distanceKm: number
  durationText: string
  stops: { address: string }[]
}

function getDayName(date: Date): string {
  const days = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  return days[date.getDay()]
}

function getMonthName(date: Date): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months[date.getMonth()]
}

function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
  }
  return slots
}

function generateDays(): Date[] {
  const days: Date[] = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

export default function ScheduleRidePage() {
  const router = useRouter()
  const [route, setRoute] = useState<RouteData | null>(null)
  const [ride, setRide] = useState<SelectedRide | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [reminder, setReminder] = useState<'15min' | '30min' | '1h' | 'none'>('30min')
  const [confirming, setConfirming] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const days = useMemo(() => generateDays(), [])
  const timeSlots = useMemo(() => generateTimeSlots(), [])

  // Filter time slots: if today, only show future times
  const availableSlots = useMemo(() => {
    const now = new Date()
    const isToday =
      selectedDay.getDate() === now.getDate() &&
      selectedDay.getMonth() === now.getMonth() &&
      selectedDay.getFullYear() === now.getFullYear()

    if (!isToday) return timeSlots

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    return timeSlots.filter((slot) => {
      const [h, m] = slot.split(':').map(Number)
      return h * 60 + m > currentMinutes + 30 // At least 30 min from now
    })
  }, [selectedDay, timeSlots])

  // Auto-select first available time
  useEffect(() => {
    if (availableSlots.length > 0 && !selectedTime) {
      setSelectedTime(availableSlots[0])
    }
  }, [availableSlots, selectedTime])

  useEffect(() => {
    const savedRoute = sessionStorage.getItem('rideRoute')
    const savedRide = sessionStorage.getItem('selectedRide')
    if (savedRoute) setRoute(JSON.parse(savedRoute))
    if (savedRide) setRide(JSON.parse(savedRide))
  }, [])

  const handleConfirm = async () => {
    if (!selectedTime || !route) {
      iosToast.error('Selecione data e horario')
      triggerHaptic('error')
      return
    }

    const scheduledDateTime = new Date(selectedDay)
    const [hours, minutes] = selectedTime.split(':').map(Number)
    scheduledDateTime.setHours(hours, minutes, 0, 0)

    const validation = validateForm(scheduledRideSchema, {
      scheduled_time: scheduledDateTime.toISOString()
    })

    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]
      iosToast.error(firstError)
      triggerHaptic('error')
      return
    }
    triggerHaptic('success')
    setConfirming(true)

    // Store schedule data
    const scheduleData = {
      ...ride,
      route,
      scheduledTime: scheduledDateTime.toISOString(),
      reminder,
    }
    sessionStorage.setItem('scheduledRide', JSON.stringify(scheduleData))

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setConfirming(false)
    setShowSuccess(true)

    setTimeout(() => {
      router.push('/uppi/home')
    }, 2500)
  }

  const formattedDate = selectedDay
    ? `${getDayName(selectedDay)}, ${selectedDay.getDate()} ${getMonthName(selectedDay)}`
    : ''

  // Success overlay
  if (showSuccess) {
    return (
      <div className="h-dvh bg-card flex flex-col items-center justify-center px-6">
        <div className="animate-ios-bounce-in">
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg shadow-emerald-500/20">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-[24px] font-bold text-foreground tracking-tight text-center animate-ios-fade-up" style={{ animationDelay: '200ms' }}>
          Corrida agendada!
        </h2>
        <p className="text-[16px] text-muted-foreground text-center mt-2 animate-ios-fade-up" style={{ animationDelay: '300ms' }}>
          {formattedDate} as {selectedTime}
        </p>
        {reminder !== 'none' && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl px-5 py-3 animate-ios-fade-up" style={{ animationDelay: '400ms' }}>
            <p className="text-[14px] text-blue-600 dark:text-blue-400 font-semibold text-center">
              Lembrete: {reminder === '15min' ? '15 minutos' : reminder === '30min' ? '30 minutos' : '1 hora'} antes
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-dvh bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card/80 ios-blur border-b border-border relative z-10">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary ios-press"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-[20px] font-bold text-foreground tracking-tight">Agendar corrida</h1>
              <p className="text-[13px] text-muted-foreground">Escolha data e horario</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-[14px] flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto ios-scroll px-5 py-4 flex flex-col gap-5">
        {/* Route summary */}
        {route && (
          <div className="animate-ios-fade-up">
            <div className="bg-secondary rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <div className="w-[2px] h-6 bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-foreground font-semibold truncate">{route.pickup}</p>
                  <div className="h-3" />
                  <p className="text-[14px] text-foreground font-semibold truncate">{route.destination}</p>
                </div>
              </div>
              {ride && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                  <span className="text-[13px] text-muted-foreground">{ride.vehicleType === 'moto' ? 'Moto' : ride.vehicleType === 'economy' ? 'Economico' : 'Eletrico'}</span>
                  <span className="text-muted-foreground/40">{'|'}</span>
                  <span className="text-[13px] font-bold text-blue-600">R$ {ride.price?.toFixed(2)}</span>
                  {ride.distanceKm && (
                    <>
                      <span className="text-muted-foreground/40">{'|'}</span>
                      <span className="text-[13px] text-muted-foreground">{ride.distanceKm.toFixed(1)} km</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Day selector - horizontal scroll */}
        <div className="animate-ios-fade-up" style={{ animationDelay: '100ms' }}>
          <p className="ios-section-header mb-3">Selecione o dia</p>
          <div className="flex gap-2.5 overflow-x-auto ios-scroll -mx-5 px-5 pb-1">
            {days.map((day, i) => {
              const isSelected = selectedDay.toDateString() === day.toDateString()
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection')
                    setSelectedDay(day)
                    setSelectedTime('')
                  }}
                  className={`flex flex-col items-center gap-1 px-3.5 py-3 rounded-2xl min-w-[64px] ios-press transition-all ${
                    isSelected
                      ? 'bg-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-secondary'
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {isToday ? 'Hoje' : getDayName(day).slice(0, 3)}
                  </span>
                  <span className={`text-[22px] font-bold tracking-tight ${isSelected ? 'text-white' : 'text-foreground'}`}>
                    {day.getDate()}
                  </span>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {getMonthName(day)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time grid */}
        <div className="animate-ios-fade-up" style={{ animationDelay: '200ms' }}>
          <p className="ios-section-header mb-3">Selecione o horario</p>
          {availableSlots.length === 0 ? (
            <div className="bg-secondary rounded-2xl p-6 text-center">
              <p className="text-[15px] text-muted-foreground font-medium">Sem horarios disponiveis para hoje</p>
              <p className="text-[13px] text-muted-foreground/60 mt-1">Selecione outro dia</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedTime === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light')
                      setSelectedTime(slot)
                    }}
                    className={`py-3 rounded-[14px] text-[15px] font-semibold tabular-nums ios-press transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Reminder selector */}
        <div className="animate-ios-fade-up" style={{ animationDelay: '300ms' }}>
          <p className="ios-section-header mb-3">Lembrete</p>
          <div className="flex gap-2">
            {[
              { value: '15min' as const, label: '15 min' },
              { value: '30min' as const, label: '30 min' },
              { value: '1h' as const, label: '1 hora' },
              { value: 'none' as const, label: 'Sem' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  triggerHaptic('light')
                  setReminder(opt.value)
                }}
                className={`flex-1 py-3 rounded-[14px] text-[14px] font-semibold ios-press transition-all ${
                  reminder === opt.value
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-secondary text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="animate-ios-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="bg-amber-50 dark:bg-amber-900/15 rounded-2xl px-4 py-3.5 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-[14px] font-semibold text-amber-700 dark:text-amber-400">Preco pode variar</p>
              <p className="text-[13px] text-amber-600/80 dark:text-amber-400/60 mt-0.5 leading-relaxed">
                O preco final sera confirmado no momento da corrida, podendo variar de acordo com a demanda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom confirm */}
      <div className="bg-card/90 ios-blur border-t border-border px-5 py-3 pb-safe-offset-4">
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[15px] font-semibold text-foreground">
            {formattedDate} as {selectedTime || '--:--'}
          </p>
        </div>
        <button
          type="button"
          disabled={!selectedTime || confirming}
          onClick={handleConfirm}
          className="w-full h-[52px] rounded-[18px] bg-blue-600 text-white font-bold text-[17px] tracking-tight ios-press shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
        >
          {confirming ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Agendar corrida
            </>
          )}
        </button>
      </div>
    </div>
  )
}
