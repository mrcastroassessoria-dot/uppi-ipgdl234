'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ContextMenuOption {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

interface IOSContextMenuProps {
  children: React.ReactNode
  options: ContextMenuOption[]
  className?: string
}

export function IOSContextMenu({ children, options, className }: IOSContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const triggerRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout>()

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setPosition({ x: touch.clientX, y: touch.clientY })
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }

    // Scale down animation
    setScale(0.95)

    longPressTimer.current = setTimeout(() => {
      setIsOpen(true)
      // Stronger haptic for menu open
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 20, 10])
      }
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    setScale(1)
  }

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={cn('relative', className)}
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              className="fixed inset-0 bg-black/40 z-50"
            />

            {/* Context Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 400
              }}
              style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -50%)'
              }}
              className="z-50 min-w-[250px] bg-card/98 ios-blur-heavy rounded-[14px] overflow-hidden shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_10px_40px_rgba(0,0,0,0.3)] border-[0.5px] border-border/50"
            >
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!option.disabled) {
                      option.onClick()
                      setIsOpen(false)
                    }
                  }}
                  disabled={option.disabled}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors text-[17px] tracking-[-0.4px]',
                    option.disabled && 'opacity-40 cursor-not-allowed',
                    !option.disabled && 'ios-press hover:bg-accent/50',
                    option.variant === 'destructive' && 'text-red-500',
                    index !== options.length - 1 && 'border-b border-border/30'
                  )}
                >
                  {option.icon && (
                    <span className="w-5 h-5 flex items-center justify-center">
                      {option.icon}
                    </span>
                  )}
                  <span className="font-normal">{option.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
