'use client'

import React, { useState, useRef, useEffect } from 'react'
import { haptics } from '@/lib/utils/ios-haptics'

interface IOSSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  showValue?: boolean
  label?: string
  formatValue?: (value: number) => string
  className?: string
}

export function IOSSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
  label,
  formatValue,
  className = '',
}: IOSSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const trackRef = useRef<HTMLDivElement>(null)
  const lastHapticValue = useRef(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const percentage = ((localValue - min) / (max - min)) * 100

  const handleInteractionStart = (clientX: number) => {
    if (disabled) return
    setIsDragging(true)
    updateValue(clientX)
    haptics.trigger('light')
  }

  const handleInteractionMove = (clientX: number) => {
    if (!isDragging || disabled) return
    updateValue(clientX)
  }

  const handleInteractionEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    onChange(localValue)
    haptics.trigger('light')
  }

  const updateValue = (clientX: number) => {
    if (!trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const rawPercentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const rawValue = min + (rawPercentage / 100) * (max - min)
    const steppedValue = Math.round(rawValue / step) * step
    const clampedValue = Math.max(min, Math.min(max, steppedValue))

    // Trigger haptic on value change
    if (Math.abs(clampedValue - lastHapticValue.current) >= step) {
      haptics.trigger('selection')
      lastHapticValue.current = clampedValue
    }

    setLocalValue(clampedValue)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteractionStart(e.clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleInteractionMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleInteractionEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleInteractionStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleInteractionMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleInteractionEnd()
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const displayValue = formatValue ? formatValue(localValue) : localValue

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Label and value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-[15px] font-semibold text-foreground tabular-nums">
              {displayValue}
            </span>
          )}
        </div>
      )}

      {/* Slider track */}
      <div
        ref={trackRef}
        className={`
          relative h-[3px] bg-black/[0.08] dark:bg-white/[0.12] rounded-full
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Active track */}
        <div
          className="absolute inset-y-0 left-0 bg-[#007AFF] rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            w-[28px] h-[28px]
            bg-white
            rounded-full
            shadow-[0_1px_4px_rgba(0,0,0,0.16),0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(0,0,0,0.04)]
            transition-transform duration-100
            ${isDragging ? 'scale-110' : 'scale-100'}
            ${disabled ? '' : 'active:scale-110'}
          `}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function IOSRangeSlider({
  values,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  className = '',
}: {
  values: [number, number]
  onChange: (values: [number, number]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  label?: string
  className?: string
}) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
  const [localValues, setLocalValues] = useState(values)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalValues(values)
  }, [values])

  const minPercentage = ((localValues[0] - min) / (max - min)) * 100
  const maxPercentage = ((localValues[1] - min) / (max - min)) * 100

  const updateValue = (clientX: number, thumb: 'min' | 'max') => {
    if (!trackRef.current || disabled) return

    const rect = trackRef.current.getBoundingClientRect()
    const rawPercentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const rawValue = min + (rawPercentage / 100) * (max - min)
    const steppedValue = Math.round(rawValue / step) * step
    const clampedValue = Math.max(min, Math.min(max, steppedValue))

    const newValues: [number, number] = [...localValues]

    if (thumb === 'min') {
      newValues[0] = Math.min(clampedValue, localValues[1] - step)
    } else {
      newValues[1] = Math.max(clampedValue, localValues[0] + step)
    }

    setLocalValues(newValues)
    haptics.trigger('selection')
  }

  const handleThumbMouseDown = (thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setIsDragging(thumb)
    haptics.trigger('light')
  }

  const handleThumbTouchStart = (thumb: 'min' | 'max') => (e: React.TouchEvent) => {
    e.stopPropagation()
    if (disabled) return
    setIsDragging(thumb)
    haptics.trigger('light')
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (clientX: number) => {
      updateValue(clientX, isDragging)
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)
    
    const handleEnd = () => {
      onChange(localValues)
      setIsDragging(null)
      haptics.trigger('light')
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, localValues])

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
          <span className="text-[15px] font-semibold text-foreground tabular-nums">
            {localValues[0]} - {localValues[1]}
          </span>
        </div>
      )}

      <div
        ref={trackRef}
        className={`
          relative h-[3px] bg-black/[0.08] dark:bg-white/[0.12] rounded-full
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Active track */}
        <div
          className="absolute inset-y-0 bg-[#007AFF] rounded-full"
          style={{
            left: `${minPercentage}%`,
            right: `${100 - maxPercentage}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            w-[28px] h-[28px] bg-white rounded-full
            shadow-[0_1px_4px_rgba(0,0,0,0.16),0_1px_2px_rgba(0,0,0,0.08)]
            transition-transform duration-100
            ${isDragging === 'min' ? 'scale-110 z-10' : 'scale-100'}
          `}
          style={{ left: `${minPercentage}%` }}
          onMouseDown={handleThumbMouseDown('min')}
          onTouchStart={handleThumbTouchStart('min')}
        />

        {/* Max thumb */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            w-[28px] h-[28px] bg-white rounded-full
            shadow-[0_1px_4px_rgba(0,0,0,0.16),0_1px_2px_rgba(0,0,0,0.08)]
            transition-transform duration-100
            ${isDragging === 'max' ? 'scale-110 z-10' : 'scale-100'}
          `}
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={handleThumbMouseDown('max')}
          onTouchStart={handleThumbTouchStart('max')}
        />
      </div>
    </div>
  )
}
