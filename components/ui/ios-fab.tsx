'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { useState, ReactNode } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface SpeedDialAction {
  icon: ReactNode
  label: string
  onClick: () => void
  color?: string
}

interface IOSFABProps {
  icon?: ReactNode
  label?: string
  onClick?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  variant?: 'default' | 'extended'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  hideOnScroll?: boolean
  speedDial?: SpeedDialAction[]
  className?: string
}

export function IOSFAB({
  icon = <Plus className="w-6 h-6" />,
  label,
  onClick,
  position = 'bottom-right',
  variant = 'default',
  color = 'primary',
  size = 'md',
  hideOnScroll = false,
  speedDial,
  className
}: IOSFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 100], [1, hideOnScroll ? 0 : 1])
  const scale = useTransform(scrollY, [0, 100], [1, hideOnScroll ? 0.8 : 1])

  const handleClick = () => {
    if (speedDial) {
      triggerHaptic('impact', 'medium')
      setIsOpen(!isOpen)
    } else if (onClick) {
      triggerHaptic('impact', 'medium')
      onClick()
    }
  }

  const handleActionClick = (action: SpeedDialAction) => {
    triggerHaptic('selection')
    action.onClick()
    setIsOpen(false)
  }

  const positionStyles = {
    'bottom-right': 'bottom-safe-offset-20 right-5',
    'bottom-left': 'bottom-safe-offset-20 left-5',
    'bottom-center': 'bottom-safe-offset-20 left-1/2 -translate-x-1/2'
  }

  const sizeStyles = {
    sm: variant === 'extended' ? 'h-12 px-4' : 'w-12 h-12',
    md: variant === 'extended' ? 'h-14 px-5' : 'w-14 h-14',
    lg: variant === 'extended' ? 'h-16 px-6' : 'w-16 h-16'
  }

  const colorStyles = {
    primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
    secondary: 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/30',
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
    warning: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30',
    error: 'bg-red-500 text-white shadow-lg shadow-red-500/30'
  }

  return (
    <>
      {/* Speed Dial Actions */}
      {speedDial && (
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              />

              {/* Actions */}
              <div className={cn('fixed z-40', positionStyles[position])}>
                <div className="flex flex-col-reverse gap-3 mb-3">
                  {speedDial.map((action, index) => (
                    <motion.button
                      key={index}
                      initial={{ scale: 0, y: 20, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0, y: 20, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        delay: index * 0.05
                      }}
                      onClick={() => handleActionClick(action)}
                      className="flex items-center gap-3"
                    >
                      {/* Label */}
                      <span className="px-3 py-2 bg-card rounded-xl shadow-lg text-sm font-medium text-foreground whitespace-nowrap">
                        {action.label}
                      </span>

                      {/* Icon */}
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center shadow-lg',
                          action.color || 'bg-card text-foreground'
                        )}
                      >
                        {action.icon}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Main FAB */}
      <motion.button
        onClick={handleClick}
        style={{ opacity, scale }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25
        }}
        className={cn(
          'fixed z-50 flex items-center justify-center gap-2',
          'rounded-full font-medium',
          'active:shadow-xl transition-shadow duration-200',
          positionStyles[position],
          sizeStyles[size],
          colorStyles[color],
          className
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen && speedDial ? <X className="w-6 h-6" /> : icon}
        </motion.div>
        
        {variant === 'extended' && label && (
          <span className="text-base font-semibold">
            {label}
          </span>
        )}
      </motion.button>
    </>
  )
}

// Mini FAB (smaller variant)
export function IOSMiniFAB({
  icon,
  onClick,
  className
}: {
  icon: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <motion.button
      onClick={() => {
        triggerHaptic('impact', 'light')
        onClick()
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25
      }}
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        'bg-muted text-foreground shadow-md',
        'active:shadow-lg transition-shadow duration-200',
        className
      )}
    >
      {icon}
    </motion.button>
  )
}
