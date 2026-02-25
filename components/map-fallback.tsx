'use client'

import { useState, useEffect } from 'react'

interface MapFallbackProps {
  pickupAddress?: string
  dropoffAddress?: string
  className?: string
}

/**
 * Fallback UI when Google Maps fails to load.
 * Shows a clean iOS-style card with route info and animated visual.
 */
export function MapFallback({ pickupAddress, dropoffAddress, className = '' }: MapFallbackProps) {
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setPulse((p) => !p), 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`flex items-center justify-center bg-secondary/50 ${className}`}>
      <div className="flex flex-col items-center gap-5 px-6 max-w-[320px]">
        {/* Animated GPS visual */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-1000 ${pulse ? 'scale-110' : 'scale-100'}`}>
            <div className={`w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-1000 ${pulse ? 'scale-105' : 'scale-95'}`}>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Radar rings */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
        </div>

        <div className="text-center">
          <h3 className="text-[17px] font-bold text-foreground tracking-tight">Mapa indisponivel</h3>
          <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
            Estamos usando sua localizacao GPS. O mapa sera restaurado automaticamente.
          </p>
        </div>

        {/* Route info cards if available */}
        {(pickupAddress || dropoffAddress) && (
          <div className="w-full flex flex-col gap-2">
            {pickupAddress && (
              <div className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Embarque</p>
                  <p className="text-[14px] font-semibold text-foreground truncate">{pickupAddress}</p>
                </div>
              </div>
            )}
            {dropoffAddress && (
              <div className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Destino</p>
                  <p className="text-[14px] font-semibold text-foreground truncate">{dropoffAddress}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-2 bg-amber-500/10 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">Reconectando ao mapa...</span>
        </div>
      </div>
    </div>
  )
}
