'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ReactNode, useState } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSCardProps {
  children: ReactNode
  onClick?: () => void
  onLongPress?: () => void
  variant?: 'default' | 'elevated' | 'filled' | 'glass'
  hoverable?: boolean
  pressable?: boolean
  className?: string
}

export function IOSCard({
  children,
  onClick,
  onLongPress,
  variant = 'default',
  hoverable = true,
  pressable = true,
  className
}: IOSCardProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const handlePressStart = () => {
    if (!pressable) return
    
    setIsPressed(true)
    triggerHaptic('selection')

    if (onLongPress) {
      const timer = setTimeout(() => {
        triggerHaptic('impact', 'heavy')
        onLongPress()
      }, 500)
      setLongPressTimer(timer)
    }
  }

  const handlePressEnd = () => {
    setIsPressed(false)
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleClick = () => {
    if (onClick && !longPressTimer) {
      onClick()
    }
  }

  const variantStyles = {
    default: 'bg-card border border-border',
    elevated: 'bg-card shadow-lg border border-border/50',
    filled: 'bg-muted/50',
    glass: 'bg-card/60 backdrop-blur-xl border border-border/50'
  }

  return (
    <motion.div
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      whileHover={hoverable ? { scale: 1.02 } : undefined}
      whileTap={pressable ? { scale: 0.98 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25
      }}
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-200',
        variantStyles[variant],
        isPressed && 'shadow-sm',
        (onClick || onLongPress) && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// Card Header
export function IOSCardHeader({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-4 pt-4 pb-2', className)}>
      {children}
    </div>
  )
}

// Card Title
export function IOSCardTitle({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground', className)}>
      {children}
    </h3>
  )
}

// Card Description
export function IOSCardDescription({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  )
}

// Card Content
export function IOSCardContent({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-4 py-3', className)}>
      {children}
    </div>
  )
}

// Card Footer
export function IOSCardFooter({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-4 pb-4 pt-2 flex items-center gap-2', className)}>
      {children}
    </div>
  )
}

// Hero Card (Large featured card)
export function IOSHeroCard({
  children,
  image,
  gradient,
  onClick,
  className
}: {
  children: ReactNode
  image?: string
  gradient?: string
  onClick?: () => void
  className?: string
}) {
  return (
    <IOSCard
      onClick={onClick}
      variant="elevated"
      className={cn('relative h-48 overflow-hidden', className)}
    >
      {/* Background */}
      {image && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}
      {gradient && (
        <div
          className="absolute inset-0"
          style={{ background: gradient }}
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 text-white">
        {children}
      </div>
    </IOSCard>
  )
}

// Compact Card (Small info cards)
export function IOSCompactCard({
  icon,
  title,
  value,
  trend,
  onClick,
  className
}: {
  icon?: ReactNode
  title: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  onClick?: () => void
  className?: string
}) {
  return (
    <IOSCard
      onClick={onClick}
      variant="filled"
      className={cn('p-4', className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-primary">{icon}</div>}
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
        {trend && (
          <div className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full',
            trend.isPositive
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-red-500/10 text-red-500'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </IOSCard>
  )
}
