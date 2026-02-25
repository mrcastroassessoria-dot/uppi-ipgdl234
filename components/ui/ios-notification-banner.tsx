'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, useEffect, ReactNode } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSNotificationBannerProps {
  show: boolean
  onClose: () => void
  title: string
  message?: string
  icon?: ReactNode
  image?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  position?: 'top' | 'bottom'
  className?: string
}

export function IOSNotificationBanner({
  show,
  onClose,
  title,
  message,
  icon,
  image,
  action,
  duration = 5000,
  variant = 'default',
  position = 'top',
  className
}: IOSNotificationBannerProps) {
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50
    const direction = position === 'top' ? -1 : 1
    
    if (info.offset.y * direction > threshold || Math.abs(info.velocity.y) > 500) {
      triggerHaptic('impact', 'medium')
      onClose()
    }
  }

  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-emerald-500/10 border-emerald-500/20',
    warning: 'bg-orange-500/10 border-orange-500/20',
    error: 'bg-red-500/10 border-red-500/20'
  }

  const iconColors = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-orange-500',
    error: 'text-red-500'
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          initial={{
            y: position === 'top' ? -200 : 200,
            opacity: 0,
            scale: 0.9
          }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1
          }}
          exit={{
            y: position === 'top' ? -200 : 200,
            opacity: 0,
            scale: 0.9
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30
          }}
          className={cn(
            'fixed left-4 right-4 z-50 mx-auto max-w-md',
            position === 'top' ? 'top-safe' : 'bottom-safe',
            className
          )}
        >
          <motion.div
            whileTap={{ scale: isDragging ? 1 : 0.98 }}
            onClick={() => {
              if (!isDragging && action) {
                triggerHaptic('selection')
                action.onClick()
              }
            }}
            className={cn(
              'relative rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden',
              'cursor-pointer',
              variantStyles[variant]
            )}
          >
            {/* Progress bar */}
            {duration > 0 && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className="absolute top-0 left-0 right-0 h-0.5 bg-primary origin-left"
              />
            )}

            {/* Content */}
            <div className="flex items-start gap-3 p-4">
              {/* Icon or Image */}
              {icon && !image && (
                <div className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  'bg-background/50',
                  iconColors[variant]
                )}>
                  {icon}
                </div>
              )}
              {image && (
                <img
                  src={image}
                  alt=""
                  className="flex-shrink-0 w-10 h-10 rounded-full object-cover"
                />
              )}

              {/* Text Content */}
              <div className="flex-1 min-w-0 pt-1">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {title}
                </h4>
                {message && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {message}
                  </p>
                )}
                {action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerHaptic('selection')
                      action.onClick()
                    }}
                    className="text-sm font-medium text-primary mt-2 hover:underline"
                  >
                    {action.label}
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  triggerHaptic('selection')
                  onClose()
                }}
                className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                  'bg-muted/50 text-muted-foreground hover:bg-muted',
                  'transition-colors duration-150'
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for managing notification banners
export function useIOSNotificationBanner() {
  const [notification, setNotification] = useState<{
    show: boolean
    title: string
    message?: string
    icon?: ReactNode
    variant?: 'default' | 'success' | 'warning' | 'error'
    action?: {
      label: string
      onClick: () => void
    }
  }>({
    show: false,
    title: ''
  })

  const showNotification = (params: Omit<typeof notification, 'show'>) => {
    setNotification({ ...params, show: true })
    triggerHaptic('notification', 'success')
  }

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }))
  }

  return {
    notification,
    showNotification,
    hideNotification
  }
}
