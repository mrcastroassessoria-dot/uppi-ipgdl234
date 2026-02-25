'use client'

import React from 'react'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral'
type BadgeSize = 'sm' | 'md' | 'lg'

interface IOSBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  count?: number
  maxCount?: number
  showZero?: boolean
  className?: string
}

export function IOSBadge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  count,
  maxCount = 99,
  showZero = false,
  className = '',
}: IOSBadgeProps) {
  const variantStyles = {
    default: 'bg-[#FF3B30] text-white',
    success: 'bg-[#34C759] text-white',
    error: 'bg-[#FF3B30] text-white',
    warning: 'bg-[#FF9500] text-white',
    info: 'bg-[#007AFF] text-white',
    neutral: 'bg-[#8E8E93] text-white',
  }

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 min-w-[16px] h-[16px]',
    md: 'text-[11px] px-2 min-w-[20px] h-[20px]',
    lg: 'text-[12px] px-2.5 min-w-[24px] h-[24px]',
  }

  const dotSizes = {
    sm: 'w-[6px] h-[6px]',
    md: 'w-[8px] h-[8px]',
    lg: 'w-[10px] h-[10px]',
  }

  const shouldShowBadge = count !== undefined ? (count > 0 || showZero) : true

  if (!shouldShowBadge && !dot) return <>{children}</>

  const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count

  return (
    <div className="relative inline-flex">
      {children}
      {dot ? (
        <span
          className={`
            absolute -top-0.5 -right-0.5
            ${dotSizes[size]}
            rounded-full
            ${variantStyles[variant]}
            border-2 border-background
            ${className}
          `}
        />
      ) : (
        <span
          className={`
            absolute -top-1 -right-1
            flex items-center justify-center
            rounded-full
            font-bold
            tabular-nums
            ${sizeStyles[size]}
            ${variantStyles[variant]}
            border-2 border-background
            shadow-[0_1px_3px_rgba(0,0,0,0.16)]
            ${className}
          `}
        >
          {displayCount}
        </span>
      )}
    </div>
  )
}

export function IOSStatusBadge({
  children,
  status,
  pulse = false,
  className = '',
}: {
  children: React.ReactNode
  status: 'online' | 'offline' | 'busy' | 'away'
  pulse?: boolean
  className?: string
}) {
  const statusColors = {
    online: 'bg-[#34C759]',
    offline: 'bg-[#8E8E93]',
    busy: 'bg-[#FF3B30]',
    away: 'bg-[#FF9500]',
  }

  return (
    <div className="relative inline-flex">
      {children}
      <span
        className={`
          absolute bottom-0 right-0
          w-[10px] h-[10px]
          rounded-full
          ${statusColors[status]}
          border-[2px] border-background
          ${pulse ? 'animate-pulse' : ''}
          ${className}
        `}
      />
    </div>
  )
}

export function IOSTextBadge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  const variantStyles = {
    default: 'bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF3B30]/20',
    success: 'bg-[#34C759]/10 text-[#34C759] dark:bg-[#34C759]/20',
    error: 'bg-[#FF3B30]/10 text-[#FF3B30] dark:bg-[#FF3B30]/20',
    warning: 'bg-[#FF9500]/10 text-[#FF9500] dark:bg-[#FF9500]/20',
    info: 'bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#007AFF]/20',
    neutral: 'bg-black/[0.06] text-foreground dark:bg-white/[0.08]',
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5
        rounded-[6px]
        text-[11px] font-semibold
        uppercase tracking-wide
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
