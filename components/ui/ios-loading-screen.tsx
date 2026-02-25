'use client'

import React from 'react'

interface IOSLoadingScreenProps {
  message?: string
  progress?: number
  showProgress?: boolean
}

export function IOSLoadingScreen({ 
  message = 'Carregando...', 
  progress,
  showProgress = false 
}: IOSLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* iOS-style spinner */}
        <div className="relative w-16 h-16">
          <svg
            className="animate-spin"
            viewBox="0 0 50 50"
            style={{
              animation: 'spin 1s linear infinite',
            }}
          >
            <circle
              className="stroke-[#007AFF] opacity-25"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className="stroke-[#007AFF]"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
              strokeDasharray="80"
              strokeDashoffset="60"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Message */}
        {message && (
          <p className="text-[17px] font-semibold text-foreground tracking-[-0.4px] animate-pulse">
            {message}
          </p>
        )}

        {/* Progress bar */}
        {showProgress && progress !== undefined && (
          <div className="w-64">
            <div className="h-1 bg-black/[0.08] dark:bg-white/[0.12] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#007AFF] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
            <p className="text-[13px] text-[#8E8E93] text-center mt-2 tabular-nums">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function IOSLoadingOverlay({ 
  message = 'Carregando...', 
  transparent = false 
}: { message?: string; transparent?: boolean }) {
  return (
    <div className={`
      fixed inset-0 z-[9999] flex items-center justify-center
      ${transparent 
        ? 'bg-black/20 dark:bg-black/40 ios-blur-heavy' 
        : 'bg-background'
      }
    `}>
      <div className="ios-glass rounded-[24px] px-8 py-6 flex flex-col items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.24)]">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <svg
            className="animate-spin"
            viewBox="0 0 50 50"
          >
            <circle
              className="stroke-[#007AFF] opacity-25"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className="stroke-[#007AFF]"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
              strokeDasharray="80"
              strokeDashoffset="60"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Message */}
        <p className="text-[15px] font-semibold text-foreground tracking-[-0.2px]">
          {message}
        </p>
      </div>
    </div>
  )
}

export function IOSSpinnerInline({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <svg
        className="animate-spin"
        viewBox="0 0 50 50"
      >
        <circle
          className="stroke-current opacity-25"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
        />
        <circle
          className="stroke-current"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeDasharray="80"
          strokeDashoffset="60"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
