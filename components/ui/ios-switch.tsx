'use client'

import React from 'react'
import { haptics } from '@/lib/utils/ios-haptics'

interface IOSSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function IOSSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className = '',
}: IOSSwitchProps) {
  const sizeConfig = {
    sm: {
      track: 'w-[42px] h-[24px]',
      thumb: 'w-[20px] h-[20px]',
      translate: 'translate-x-[18px]',
    },
    md: {
      track: 'w-[51px] h-[31px]',
      thumb: 'w-[27px] h-[27px]',
      translate: 'translate-x-[20px]',
    },
    lg: {
      track: 'w-[60px] h-[36px]',
      thumb: 'w-[32px] h-[32px]',
      translate: 'translate-x-[24px]',
    },
  }

  const config = sizeConfig[size]

  const handleToggle = () => {
    if (disabled) return
    
    if (!checked) {
      haptics.interactions.toggleOn()
    } else {
      haptics.interactions.toggleOff()
    }
    
    onChange(!checked)
  }

  const SwitchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
      className={`
        relative inline-flex items-center shrink-0
        ${config.track}
        rounded-full
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${disabled 
          ? 'opacity-40 cursor-not-allowed' 
          : 'cursor-pointer ios-press'
        }
        ${checked
          ? 'bg-[#34C759] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
          : 'bg-[#E5E5EA] dark:bg-[#39393D] shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]'
        }
        ${className}
      `}
    >
      {/* Thumb */}
      <span
        className={`
          ${config.thumb}
          bg-white
          rounded-full
          shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${checked 
            ? config.translate
            : 'translate-x-[2px]'
          }
        `}
      />
    </button>
  )

  if (label || description) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {label && (
            <div className="text-[17px] font-normal text-foreground tracking-[-0.4px]">
              {label}
            </div>
          )}
          {description && (
            <div className="text-[13px] text-[#8E8E93] mt-0.5 leading-snug">
              {description}
            </div>
          )}
        </div>
        {SwitchElement}
      </div>
    )
  }

  return SwitchElement
}
