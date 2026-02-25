'use client'

import { cn } from '@/lib/utils'
import { Search, X, Mic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSSearchBarProps {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  onCancel?: () => void
  placeholder?: string
  showVoice?: boolean
  showCancel?: boolean
  autoFocus?: boolean
  className?: string
}

export function IOSSearchBar({
  value,
  onChange,
  onFocus,
  onBlur,
  onCancel,
  placeholder = 'Search',
  showVoice = true,
  showCancel = true,
  autoFocus = false,
  className
}: IOSSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleFocus = () => {
    setIsFocused(true)
    triggerHaptic('selection')
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const handleClear = () => {
    onChange('')
    triggerHaptic('impact', 'light')
    inputRef.current?.focus()
  }

  const handleCancel = () => {
    onChange('')
    setIsFocused(false)
    triggerHaptic('selection')
    onCancel?.()
    inputRef.current?.blur()
  }

  const handleVoice = () => {
    triggerHaptic('impact', 'medium')
    // Voice search implementation
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Search Input Container */}
      <motion.div
        className="relative flex-1"
        animate={{
          paddingRight: isFocused && showCancel ? '0px' : '0px'
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
      >
        {/* Background */}
        <div className={cn(
          'absolute inset-0 rounded-xl transition-all duration-200',
          isFocused
            ? 'bg-card shadow-sm border border-border'
            : 'bg-muted/50'
        )} />

        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Search className="w-4 h-4" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'relative w-full h-10 pl-9 bg-transparent',
            'text-base text-foreground placeholder:text-muted-foreground',
            'focus:outline-none',
            (value || showVoice) ? 'pr-20' : 'pr-4'
          )}
        />

        {/* Right Actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <AnimatePresence>
            {value && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleClear}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center',
                  'bg-muted-foreground/20 text-muted-foreground',
                  'hover:bg-muted-foreground/30 active:scale-90',
                  'transition-all duration-150'
                )}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>

          {showVoice && !value && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              onClick={handleVoice}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                'text-primary hover:bg-primary/10 active:scale-90',
                'transition-all duration-150'
              )}
            >
              <Mic className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Cancel Button */}
      <AnimatePresence>
        {isFocused && showCancel && (
          <motion.button
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            onClick={handleCancel}
            className="text-primary font-medium text-base whitespace-nowrap active:opacity-50 transition-opacity"
          >
            Cancel
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// Scope bar for filtering search results
interface IOSScopeBarProps {
  options: string[]
  selected: string
  onChange: (value: string) => void
  className?: string
}

export function IOSScopeBar({ options, selected, onChange, className }: IOSScopeBarProps) {
  return (
    <div className={cn('flex gap-2 px-4', className)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => {
            triggerHaptic('selection')
            onChange(option)
          }}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            'active:scale-95',
            selected === option
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
