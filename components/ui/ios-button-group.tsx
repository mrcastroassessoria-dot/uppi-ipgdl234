'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface IOSButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function IOSButtonGroup({ 
  children, 
  className,
  orientation = 'horizontal' 
}: IOSButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex bg-black/[0.05] dark:bg-white/[0.08] p-[3px]',
        orientation === 'horizontal' ? 'rounded-[14px] flex-row' : 'rounded-[16px] flex-col',
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child
        
        return React.cloneElement(child as React.ReactElement<any>, {
          className: cn(
            child.props.className,
            'rounded-[11px] shadow-none',
            orientation === 'horizontal' && 'first:rounded-l-[11px] last:rounded-r-[11px]',
            orientation === 'vertical' && 'first:rounded-t-[13px] last:rounded-b-[13px]'
          )
        })
      })}
    </div>
  )
}

// Segmented Control - iOS style toggle
interface IOSSegmentedControlProps {
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>
  value: string
  onChange: (value: string) => void
  className?: string
}

export function IOSSegmentedControl({ 
  options, 
  value, 
  onChange,
  className 
}: IOSSegmentedControlProps) {
  return (
    <div
      className={cn(
        'inline-flex bg-black/[0.05] dark:bg-white/[0.08] p-[2px] rounded-[10px] gap-[2px]',
        className
      )}
      role="group"
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center justify-center gap-1.5 px-4 h-[32px] rounded-[8px] text-[13px] font-semibold tracking-[-0.2px] transition-all duration-200',
            value === option.value
              ? 'bg-white dark:bg-[#2C2C2E] text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.icon && (
            <span className="[&_svg]:w-4 [&_svg]:h-4">{option.icon}</span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  )
}
