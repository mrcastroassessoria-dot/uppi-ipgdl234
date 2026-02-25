'use client'

import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSChipProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  disabled?: boolean
  onRemove?: () => void
  onClick?: () => void
  icon?: React.ReactNode
  className?: string
}

const variantStyles = {
  default: 'bg-muted/50 text-foreground hover:bg-muted/70',
  primary: 'bg-primary/10 text-primary hover:bg-primary/20',
  success: 'bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500/20',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 hover:bg-blue-500/20'
}

const sizeStyles = {
  sm: 'h-6 px-2 text-xs gap-1',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-10 px-4 text-base gap-2'
}

export function IOSChip({
  children,
  variant = 'default',
  size = 'md',
  selected = false,
  disabled = false,
  onRemove,
  onClick,
  icon,
  className
}: IOSChipProps) {
  const handleClick = () => {
    if (disabled) return
    triggerHaptic('light')
    onClick?.()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    triggerHaptic('light')
    onRemove?.()
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full font-medium',
        'transition-all duration-200',
        'select-none',
        sizeStyles[size],
        variantStyles[variant],
        selected && 'ring-2 ring-primary ring-offset-2',
        onClick && !disabled && 'cursor-pointer active:scale-95',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && (
        <span className="flex items-center justify-center">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {onRemove && !disabled && (
        <button
          onClick={handleRemove}
          className={cn(
            'flex items-center justify-center',
            'rounded-full hover:bg-black/10 dark:hover:bg-white/10',
            'transition-colors duration-200',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )}
        >
          <X className="w-full h-full" />
        </button>
      )}
    </div>
  )
}

// Chip Group Component
interface IOSChipGroupProps {
  children: React.ReactNode
  variant?: 'row' | 'wrap'
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const gapStyles = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3'
}

export function IOSChipGroup({
  children,
  variant = 'wrap',
  gap = 'md',
  className
}: IOSChipGroupProps) {
  return (
    <div
      className={cn(
        'flex items-center',
        variant === 'wrap' ? 'flex-wrap' : 'overflow-x-auto',
        gapStyles[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Selectable Chip Group
interface IOSSelectableChipGroupProps {
  options: Array<{ label: string; value: string; icon?: React.ReactNode }>
  value?: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  variant?: IOSChipProps['variant']
  size?: IOSChipProps['size']
  className?: string
}

export function IOSSelectableChipGroup({
  options,
  value,
  onChange,
  multiple = false,
  variant = 'default',
  size = 'md',
  className
}: IOSSelectableChipGroupProps) {
  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
    }
  }

  const isSelected = (optionValue: string) => {
    return multiple
      ? Array.isArray(value) && value.includes(optionValue)
      : value === optionValue
  }

  return (
    <IOSChipGroup className={className}>
      {options.map((option) => (
        <IOSChip
          key={option.value}
          variant={variant}
          size={size}
          selected={isSelected(option.value)}
          onClick={() => handleSelect(option.value)}
          icon={option.icon}
        >
          {option.label}
        </IOSChip>
      ))}
    </IOSChipGroup>
  )
}
