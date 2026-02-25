'use client'

import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSDatePickerProps {
  value: Date
  onChange: (date: Date) => void
  label?: string
  mode?: 'date' | 'time' | 'datetime'
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function IOSDatePicker({
  value,
  onChange,
  label = 'Date',
  mode = 'date',
  minDate,
  maxDate,
  className
}: IOSDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (date: Date) => {
    if (mode === 'time') {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    }
    if (mode === 'datetime') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleOpen = () => {
    triggerHaptic('selection')
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    triggerHaptic('selection')
    onChange(newDate)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'bg-card rounded-xl border border-border',
          'hover:bg-muted/50 active:scale-[0.98]',
          'transition-all duration-150',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div className="text-left">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-base font-medium text-foreground">
              {formatDate(value)}
            </div>
          </div>
        </div>
      </button>

      {/* Picker Sheet */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-safe shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">{label}</h3>
              <button
                onClick={handleClose}
                className="text-primary font-medium text-base hover:opacity-70 transition-opacity"
              >
                Done
              </button>
            </div>

            {/* Native Date Input */}
            <div className="relative">
              <input
                type={mode === 'time' ? 'time' : mode === 'datetime' ? 'datetime-local' : 'date'}
                value={
                  mode === 'time'
                    ? value.toTimeString().slice(0, 5)
                    : value.toISOString().slice(0, mode === 'datetime' ? 16 : 10)
                }
                onChange={handleDateChange}
                min={minDate?.toISOString().slice(0, mode === 'datetime' ? 16 : 10)}
                max={maxDate?.toISOString().slice(0, mode === 'datetime' ? 16 : 10)}
                className={cn(
                  'w-full h-64 text-2xl text-center bg-transparent',
                  'appearance-none focus:outline-none',
                  // Hide default styling
                  '[&::-webkit-calendar-picker-indicator]:opacity-0',
                  '[&::-webkit-calendar-picker-indicator]:absolute',
                  '[&::-webkit-calendar-picker-indicator]:inset-0',
                  '[&::-webkit-calendar-picker-indicator]:w-full',
                  '[&::-webkit-calendar-picker-indicator]:h-full',
                  '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
                )}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

// Time Wheel Picker (iOS Style)
export function IOSTimeWheelPicker({
  value,
  onChange,
  className
}: {
  value: Date
  onChange: (date: Date) => void
  className?: string
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {/* Hour Wheel */}
      <div className="h-48 overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {hours.map((hour) => (
          <button
            key={hour}
            onClick={() => {
              const newDate = new Date(value)
              newDate.setHours(hour)
              triggerHaptic('selection')
              onChange(newDate)
            }}
            className={cn(
              'w-20 h-12 snap-center flex items-center justify-center',
              'text-2xl font-medium transition-all duration-150',
              value.getHours() % 12 === hour % 12
                ? 'text-foreground scale-110'
                : 'text-muted-foreground scale-90'
            )}
          >
            {hour}
          </button>
        ))}
      </div>

      <span className="text-2xl font-medium text-foreground">:</span>

      {/* Minute Wheel */}
      <div className="h-48 overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {minutes.map((minute) => (
          <button
            key={minute}
            onClick={() => {
              const newDate = new Date(value)
              newDate.setMinutes(minute)
              triggerHaptic('selection')
              onChange(newDate)
            }}
            className={cn(
              'w-20 h-12 snap-center flex items-center justify-center',
              'text-2xl font-medium transition-all duration-150',
              value.getMinutes() === minute
                ? 'text-foreground scale-110'
                : 'text-muted-foreground scale-90'
            )}
          >
            {minute.toString().padStart(2, '0')}
          </button>
        ))}
      </div>

      {/* AM/PM */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            const newDate = new Date(value)
            newDate.setHours(value.getHours() % 12)
            triggerHaptic('selection')
            onChange(newDate)
          }}
          className={cn(
            'w-16 h-10 rounded-lg text-base font-medium transition-all duration-150',
            value.getHours() < 12
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          AM
        </button>
        <button
          onClick={() => {
            const newDate = new Date(value)
            newDate.setHours(value.getHours() % 12 + 12)
            triggerHaptic('selection')
            onChange(newDate)
          }}
          className={cn(
            'w-16 h-10 rounded-lg text-base font-medium transition-all duration-150',
            value.getHours() >= 12
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          PM
        </button>
      </div>
    </div>
  )
}
