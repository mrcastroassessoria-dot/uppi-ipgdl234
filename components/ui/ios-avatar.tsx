'use client'

import React from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IOSAvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'circle' | 'rounded' | 'square'
  status?: 'online' | 'offline' | 'busy' | 'away'
  badge?: React.ReactNode
  badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
  onClick?: () => void
  className?: string
  ringColor?: string
  showRing?: boolean
}

const sizeStyles = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl'
}

const variantStyles = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
  square: 'rounded-md'
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500'
}

const badgePositions = {
  'top-right': 'top-0 right-0',
  'bottom-right': 'bottom-0 right-0',
  'top-left': 'top-0 left-0',
  'bottom-left': 'bottom-0 left-0'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-teal-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500'
  ]
  
  const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1)
  return colors[charCode % colors.length]
}

export function IOSAvatar({
  src,
  alt,
  name = 'User',
  size = 'md',
  variant = 'circle',
  status,
  badge,
  badgePosition = 'bottom-right',
  onClick,
  className,
  ringColor = 'ring-primary',
  showRing = false
}: IOSAvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)

  return (
    <div className="relative inline-block">
      <div
        onClick={onClick}
        className={cn(
          'relative flex items-center justify-center',
          'overflow-hidden',
          'transition-all duration-200',
          sizeStyles[size],
          variantStyles[variant],
          showRing && `ring-2 ring-offset-2 ${ringColor}`,
          onClick && 'cursor-pointer active:scale-95',
          className
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center text-white font-semibold', bgColor)}>
            {name ? initials : <User className="w-1/2 h-1/2" />}
          </div>
        )}
      </div>

      {/* Status Indicator */}
      {status && (
        <span
          className={cn(
            'absolute',
            'rounded-full border-2 border-background',
            'transition-all duration-200',
            statusColors[status],
            badgePositions[badgePosition],
            size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
          )}
        />
      )}

      {/* Badge */}
      {badge && (
        <div
          className={cn(
            'absolute',
            'flex items-center justify-center',
            'rounded-full',
            'bg-red-500 text-white text-xs font-semibold',
            'border-2 border-background',
            badgePositions[badgePosition],
            size === 'xs' || size === 'sm' ? 'w-4 h-4 text-[10px]' : 'w-5 h-5'
          )}
        >
          {badge}
        </div>
      )}
    </div>
  )
}

// Avatar Group Component
interface IOSAvatarGroupProps {
  children: React.ReactNode
  max?: number
  size?: IOSAvatarProps['size']
  variant?: IOSAvatarProps['variant']
  className?: string
}

export function IOSAvatarGroup({
  children,
  max = 3,
  size = 'md',
  variant = 'circle',
  className
}: IOSAvatarGroupProps) {
  const childArray = React.Children.toArray(children)
  const displayedChildren = childArray.slice(0, max)
  const remainingCount = childArray.length - max

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {displayedChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-background">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center',
            'bg-muted text-muted-foreground font-semibold',
            'ring-2 ring-background',
            sizeStyles[size],
            variantStyles[variant]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
