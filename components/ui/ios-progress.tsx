'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface IOSProgressProps {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  showLabel?: boolean
  label?: string
  className?: string
}

export function IOSProgress({
  value,
  size = 'md',
  color = 'blue',
  showLabel = false,
  label,
  className
}: IOSProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  const heightMap = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2'
  }

  const colorMap = {
    blue: 'bg-[#007AFF]',
    green: 'bg-[#34C759]',
    red: 'bg-[#FF3B30]',
    yellow: 'bg-[#FFCC00]',
    purple: 'bg-[#AF52DE]'
  }

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-foreground tracking-[-0.2px]">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-muted-foreground tracking-[-0.2px]">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full bg-secondary/30 rounded-full overflow-hidden',
        heightMap[size]
      )}>
        <motion.div
          className={cn(
            'h-full rounded-full',
            colorMap[color]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 100
          }}
        />
      </div>
    </div>
  )
}

// Circular Progress
interface IOSCircularProgressProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  showLabel?: boolean
  label?: string
  className?: string
}

export function IOSCircularProgress({
  value,
  size = 64,
  strokeWidth = 4,
  color = 'blue',
  showLabel = false,
  label,
  className
}: IOSCircularProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (clampedValue / 100) * circumference

  const colorMap = {
    blue: '#007AFF',
    green: '#34C759',
    red: '#FF3B30',
    yellow: '#FFCC00',
    purple: '#AF52DE'
  }

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-secondary/30"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorMap[color]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 100
            }}
            style={{
              strokeDasharray: circumference
            }}
          />
        </svg>
        
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-foreground tracking-[-0.2px]">
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
      </div>
      
      {label && (
        <span className="text-sm text-muted-foreground tracking-[-0.2px]">
          {label}
        </span>
      )}
    </div>
  )
}
