'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Ride } from '@/lib/types/database'
import { BottomNavigation } from '@/components/bottom-navigation'
import { RouteMap } from '@/components/route-map'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MorphingSpinner } from '@/components/ui/morphing-spinner'
import HistorySkeleton from '@/components/history-skeleton'
import { EmptyState } from '@/components/empty-state'
import { iosToast } from '@/lib/utils/ios-toast'
import { historyService } from '@/lib/services/history-service'

interface RideWithDetails extends Ride {
  driver?: {
    full_name: string
    avatar_url?: string
    rating: number
  }
  passenger?: {
    full_name: string
    avatar_url?: string
    rating: number
  }
  driver_profile?: {
    vehicle_brand?: string
    vehicle_model?: string
    vehicle_color?: string
    vehicle_plate?: string
    vehicle_type?: string
  }
}

/* ── Vehicle Icon ── */
function VehicleIcon({ type, className }: { type?: string; className?: string }) {
  if (type === 'moto') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    )
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  )
}

/* ── iOS Expandable Ride Card ── */
function RideCard({ ride, formatTime, index }: {
  ride: RideWithDetails
  formatTime: (d: string) => string
  index: number
}) {
  const [expanded, setExpanded] = useState(false)

  const statusCfg: Record<string, { dot: string; label: string; bg: string; text: string }> = {
    completed:   { dot: 'bg-[#34C759]', label: 'Concluida',    bg: 'bg-[#34C759]/10', text: 'text-[#34C759]' },
    cancelled:   { dot: 'bg-[#FF3B30]', label: 'Cancelada',    bg: 'bg-[#FF3B30]/10', text: 'text-[#FF3B30]' },
    in_progress: { dot: 'bg-[#007AFF]', label: 'Em Andamento', bg: 'bg-[#007AFF]/10', text: 'text-[#007AFF]' },
    accepted:    { dot: 'bg-[#FF9500]', label: 'Aceita',       bg: 'bg-[#FF9500]/10', text: 'text-[#FF9500]' },
    pending:     { dot: 'bg-muted-foreground', label: 'Pendente', bg: 'bg-secondary', text: 'text-muted-foreground' },
    negotiating: { dot: 'bg-[#AF52DE]', label: 'Negociando',   bg: 'bg-[#AF52DE]/10', text: 'text-[#AF52DE]' },
  }
  const st = statusCfg[ride.status] || statusCfg.pending

  const shortAddr = (addr: string) => {
    if (!addr) return '...'
    const parts = addr.split(',')
    return parts[0].trim()
  }

  const hasCoords = ride.pickup_lat && ride.pickup_lng && ride.dropoff_lat && ride.dropoff_lng

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35, delay: index * 0.04 }}
      className={cn(
        "ios-card overflow-hidden transition-shadow duration-300",
        expanded && "shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      )}
      style={{ borderRadius: 20 }}
    >
      {/* ── Collapsed Row ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-[14px] active:bg-secondary/40 transition-colors duration-150"
      >
        <div className="flex items-center gap-3.5">
          {/* Route timeline */}
          <div className="flex flex-col items-center gap-[3px] self-stretch py-[3px]">
            <div className="w-[9px] h-[9px] rounded-full bg-[#007AFF] shadow-[0_0_0_3px_rgba(0,122,255,0.15)]" />
            <div className="flex-1 w-[1.5px] bg-gradient-to-b from-[#007AFF]/40 via-border to-[#34C759]/40 rounded-full" />
            <div className="w-[9px] h-[9px] rounded-full bg-[#34C759] shadow-[0_0_0_3px_rgba(52,199,89,0.15)]" />
          </div>

          {/* Addresses */}
          <div className="flex-1 min-w-0 space-y-[10px]">
            <div>
              <p className="text-[15px] font-semibold text-foreground truncate leading-tight tracking-[-0.2px]">
                {shortAddr(ride.pickup_address)}
              </p>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground truncate leading-tight tracking-[-0.2px]">
                {shortAddr(ride.dropoff_address)}
              </p>
            </div>
          </div>

          {/* Right: Time + Price */}
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
            <span className="text-[12px] text-muted-foreground font-medium tabular-nums">
              {formatTime(ride.completed_at || ride.created_at)}
            </span>
            {ride.final_price ? (
              <span className="text-[16px] font-bold text-foreground tracking-tight tabular-nums">
                {'R$ '}{ride.final_price.toFixed(2)}
              </span>
            ) : (
              <span className={cn(st.bg, st.text, "px-2 py-[2px] rounded-full text-[10px] font-bold")}>
                {st.label}
              </span>
            )}
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="flex-shrink-0"
          >
            <svg className="w-[14px] h-[14px] text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* ── Expanded Content ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Divider */}
              <div className="h-px bg-border/60" />

              {/* Map */}
              {hasCoords && (
                <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm">
                  <RouteMap
                    origin={{ lat: ride.pickup_lat!, lng: ride.pickup_lng! }}
                    destination={{ lat: ride.dropoff_lat!, lng: ride.dropoff_lng! }}
                    className="h-[170px] w-full"
                    bottomPadding={16}
                  />
                </div>
              )}

              {/* Full Addresses */}
              <div className="ios-list-group !rounded-2xl !shadow-none !bg-secondary/40">
                <div className="px-3.5 py-3 flex items-start gap-3">
                  <div className="w-[26px] h-[26px] rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-px">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Origem</p>
                    <p className="text-[13px] font-medium text-foreground leading-snug">{ride.pickup_address}</p>
                  </div>
                </div>
                <div className="mx-3.5 h-px bg-border/40" />
                <div className="px-3.5 py-3 flex items-start gap-3">
                  <div className="w-[26px] h-[26px] rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-px">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Destino</p>
                    <p className="text-[13px] font-medium text-foreground leading-snug">{ride.dropoff_address}</p>
                  </div>
                </div>
              </div>

              {/* Driver Card */}
              {ride.driver && (
                <div className="ios-list-group !rounded-2xl !shadow-none !bg-secondary/40">
                  <div className="px-3.5 py-3 flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-[44px] h-[44px] rounded-full overflow-hidden flex-shrink-0 ring-2 ring-card shadow-sm">
                      {ride.driver.avatar_url ? (
                        <Image src={ride.driver.avatar_url || "/placeholder.svg"} alt={ride.driver.full_name} width={44} height={44} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                          <span className="text-[18px] font-bold text-blue-500">{ride.driver.full_name?.[0] || 'M'}</span>
                        </div>
                      )}
                    </div>

                    {/* Driver Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-foreground truncate tracking-[-0.2px]">{ride.driver.full_name}</p>
                      <div className="flex items-center gap-1.5 mt-[2px]">
                        <svg className="w-[12px] h-[12px] text-amber-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-[12px] font-semibold text-muted-foreground tabular-nums">{ride.driver.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>

                    {/* Price */}
                    {ride.final_price && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-[20px] font-bold text-foreground tracking-tight tabular-nums leading-none">
                          {'R$ '}{ride.final_price.toFixed(2)}
                        </p>
                        {ride.distance_km && (
                          <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{ride.distance_km} km</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vehicle details */}
                  {ride.driver_profile?.vehicle_model && (
                    <>
                      <div className="mx-3.5 h-px bg-border/40" />
                      <div className="px-3.5 py-2.5 flex items-center gap-3">
                        <div className="w-[26px] h-[26px] rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <VehicleIcon type={ride.driver_profile.vehicle_type} className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[13px] font-medium text-foreground truncate">
                            {ride.driver_profile.vehicle_brand} {ride.driver_profile.vehicle_model}
                          </span>
                          {ride.driver_profile.vehicle_color && (
                            <>
                              <span className="text-muted-foreground/30">{'|'}</span>
                              <span className="text-[12px] text-muted-foreground capitalize">{ride.driver_profile.vehicle_color}</span>
                            </>
                          )}
                        </div>
                        {ride.driver_profile.vehicle_plate && (
                          <span className="text-[12px] font-mono font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0">
                            {ride.driver_profile.vehicle_plate}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Status + Payment row */}
              <div className="flex items-center justify-between">
                <span className={cn(st.bg, st.text, "px-2.5 py-[3px] rounded-full text-[11px] font-bold flex items-center gap-1.5")}>
                  <div className={cn("w-[5px] h-[5px] rounded-full", st.dot)} />
                  {st.label}
                </span>
                {ride.payment_method && (
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {ride.payment_method === 'cash' ? 'Dinheiro' : ride.payment_method === 'pix' ? 'PIX' : 'Cartao'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Section Header ── */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-4 pb-2">
      <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  )
}

/* ── Main ── */
export default function HistoryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [rides, setRides] = useState<RideWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!driver_id ( full_name, avatar_url, rating ),
          passenger:profiles!passenger_id ( full_name, avatar_url, rating ),
          driver_profile:driver_profiles!driver_id ( vehicle_brand, vehicle_model, vehicle_color, vehicle_plate, vehicle_type )
        `)
        .or(`passenger_id.eq.${user.id},driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      setRides(data || [])
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadHistory() }, [supabase])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadHistory()
  }

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const formatDayGroup = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Hoje'
    if (diff === 1) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  }

  const completedRides = rides.filter(r => r.status === 'completed')
  const cancelledRides = rides.filter(r => r.status === 'cancelled')
  const activeRides = rides.filter(r => ['pending', 'negotiating', 'accepted', 'in_progress'].includes(r.status))

  const filtered = filter === 'completed' ? completedRides
    : filter === 'cancelled' ? cancelledRides
    : rides

  const groupByDay = (list: RideWithDetails[]) => {
    const groups: { label: string; rides: RideWithDetails[] }[] = []
    let currentLabel = ''
    for (const ride of list) {
      const label = formatDayGroup(ride.completed_at || ride.created_at)
      if (label !== currentLabel) {
        currentLabel = label
        groups.push({ label, rides: [ride] })
      } else {
        groups[groups.length - 1].rides.push(ride)
      }
    }
    return groups
  }

  const groups = groupByDay(filtered)

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <>
        <HistorySkeleton />
        <BottomNavigation />
      </>
    )
  }

  return (
    <div className="h-dvh overflow-y-auto bg-background pb-28 ios-scroll">
      {/* Refresh toast */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-card/95 ios-blur-heavy px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 border border-border/40">
              <MorphingSpinner size="sm" />
              <span className="text-[13px] font-semibold text-foreground">Atualizando...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="bg-card/80 ios-blur border-b border-border/40 sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Voltar"
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/60 ios-press"
              >
                <svg aria-hidden="true" className="w-[18px] h-[18px] text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-[20px] font-bold text-foreground tracking-tight">Viagens</h1>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500/10 ios-press disabled:opacity-50"
            >
              <svg
                className={cn('w-[18px] h-[18px] text-blue-500', refreshing && 'animate-spin')}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pt-3">
        {/* ── Summary pills ── */}
        <div className="flex gap-2 mb-1 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {[
            { key: 'all' as const, n: rides.length, label: 'Todas', color: 'text-foreground', activeBg: 'bg-foreground', activeFg: 'text-background' },
            { key: 'completed' as const, n: completedRides.length, label: 'Concluidas', color: 'text-emerald-500', activeBg: 'bg-emerald-500', activeFg: 'text-white' },
            { key: 'cancelled' as const, n: cancelledRides.length, label: 'Canceladas', color: 'text-red-500', activeBg: 'bg-red-500', activeFg: 'text-white' },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setFilter(pill.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-[7px] rounded-full text-[13px] font-semibold transition-all duration-200 ios-press flex-shrink-0",
                filter === pill.key
                  ? `${pill.activeBg} ${pill.activeFg} shadow-sm`
                  : "bg-secondary/60 text-muted-foreground"
              )}
            >
              <span className="tabular-nums">{pill.n}</span>
              <span>{pill.label}</span>
            </button>
          ))}
          {activeRides.length > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-full bg-blue-500/10 text-blue-500 text-[13px] font-semibold flex-shrink-0">
              <div className="w-[6px] h-[6px] rounded-full bg-blue-500 animate-pulse" />
              <span className="tabular-nums">{activeRides.length}</span>
              <span>Ativa{activeRides.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* ── Ride List ── */}
        {groups.length === 0 ? (
          <EmptyState
            preset="history"
            actionLabel="Pedir corrida"
            onAction={() => router.push('/uppi/ride/route-input')}
          />
        ) : (
          <div>
            {groups.map((group) => (
              <div key={group.label}>
                <SectionHeader label={group.label} />
                <div className="space-y-2.5">
                  {group.rides.map((ride, i) => (
                    <RideCard
                      key={ride.id}
                      ride={ride}
                      formatTime={formatTime}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
