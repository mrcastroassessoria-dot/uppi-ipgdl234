'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ActionSheetOption {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive'
  icon?: React.ReactNode
}

interface IOSActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  options: ActionSheetOption[]
  cancelLabel?: string
}

export function IOSActionSheet({
  isOpen,
  onClose,
  title,
  message,
  options,
  cancelLabel = 'Cancelar'
}: IOSActionSheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Action Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 35,
              stiffness: 400,
              mass: 0.8
            }}
            className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
          >
            <div className="px-2 pb-2">
              {/* Main Actions */}
              <div className="bg-card/95 ios-blur-ultra rounded-[14px] overflow-hidden mb-2 border-[0.5px] border-border/30">
                {(title || message) && (
                  <div className="px-4 py-3 text-center border-b border-border/30">
                    {title && (
                      <h3 className="text-[13px] font-semibold text-foreground/90 tracking-[-0.1px]">
                        {title}
                      </h3>
                    )}
                    {message && (
                      <p className="text-[13px] text-muted-foreground mt-1 tracking-[-0.1px]">
                        {message}
                      </p>
                    )}
                  </div>
                )}
                
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      option.onClick()
                      onClose()
                    }}
                    className={cn(
                      'w-full px-4 py-[14px] text-[20px] font-normal text-center transition-colors ios-press tracking-[-0.2px]',
                      option.variant === 'destructive'
                        ? 'text-red-500 hover:bg-red-500/5'
                        : 'text-[#007AFF] hover:bg-primary/5',
                      index !== options.length - 1 && 'border-b border-border/30'
                    )}
                  >
                    <span className="flex items-center justify-center gap-3">
                      {option.icon}
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                className="w-full bg-card/95 ios-blur-ultra rounded-[14px] px-4 py-[14px] text-[20px] font-semibold text-[#007AFF] text-center transition-colors hover:bg-primary/5 ios-press border-[0.5px] border-border/30 tracking-[-0.2px]"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
