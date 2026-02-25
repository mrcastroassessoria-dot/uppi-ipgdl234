'use client'

import React from "react"

import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { Loader2 } from 'lucide-react'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  className?: string
}

export function PullToRefresh({ children, onRefresh, className = '' }: PullToRefreshProps) {
  const { pullDistance, pullProgress, isRefreshing, canRefresh, handlers } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 150,
    resistance: 0.5,
  })

  return (
    <div 
      {...handlers}
      className={`relative overflow-auto ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity pointer-events-none"
        style={{
          height: pullDistance,
          opacity: pullProgress,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {isRefreshing ? (
            <>
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-medium">Atualizando...</span>
            </>
          ) : (
            <>
              <div 
                className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center transition-transform"
                style={{
                  transform: `rotate(${pullProgress * 360}deg)`,
                  borderTopColor: canRefresh ? 'hsl(var(--primary))' : 'transparent',
                }}
              >
                <svg 
                  className="w-4 h-4 text-primary" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              {canRefresh && (
                <span className="text-xs text-primary font-semibold">Solte para atualizar</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
