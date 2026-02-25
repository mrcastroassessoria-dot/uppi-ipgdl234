'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SegmentOption<T = string> {
  label: string
  value: T
  icon?: React.ReactNode
}

interface IOSSegmentedControlProps<T = string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  fullWidth?: boolean
}

export function IOSSegmentedControl<T = string>({
  options,
  value,
  onChange,
  className,
  fullWidth = true
}: IOSSegmentedControlProps<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const selectedIndex = options.findIndex(opt => opt.value === value)

  const handleSelect = (option: SegmentOption<T>, index: number) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    onChange(option.value)
  }

  return (
    <div
      className={cn(
        'relative bg-secondary/30 rounded-[10px] p-[2px] h-[32px] flex items-center',
        fullWidth && 'w-full',
        className
      )}
    >
      {/* Animated background */}
      <motion.div
        className="absolute top-[2px] bottom-[2px] bg-background rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
        initial={false}
        animate={{
          left: `calc(${(selectedIndex / options.length) * 100}% + 2px)`,
          width: `calc(${100 / options.length}% - 4px)`
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 500,
          mass: 0.8
        }}
      />

      {/* Options */}
      {options.map((option, index) => {
        const isSelected = selectedIndex === index
        const isHovered = hoveredIndex === index

        return (
          <button
            key={String(option.value)}
            onClick={() => handleSelect(option, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              'relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors tracking-[-0.1px]',
              isSelected
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            )}
            style={{
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {option.icon && (
              <span className="w-4 h-4 flex items-center justify-center">
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
