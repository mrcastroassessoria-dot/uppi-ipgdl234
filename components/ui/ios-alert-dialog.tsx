'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, useState } from 'react'
import { haptics } from '@/lib/utils/ios-haptics'
import { iosAnimations } from '@/lib/utils/ios-animations'

interface AlertAction {
  label: string
  onAction: () => void
  style?: 'default' | 'cancel' | 'destructive'
  disabled?: boolean
}

interface IOSAlertDialogProps {
  open: boolean
  onClose: () => void
  title: string
  message?: string
  icon?: ReactNode
  actions: AlertAction[]
  className?: string
}

export function IOSAlertDialog({
  open,
  onClose,
  title,
  message,
  icon,
  actions,
  className
}: IOSAlertDialogProps) {
  const handleAction = (action: AlertAction) => {
    if (action.disabled) return
    
    if (action.style === 'destructive') {
      haptics.notificationWarning()
    } else {
      haptics.impactLight()
    }
    
    action.onAction()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={iosAnimations.modal}
              className={cn(
                'w-full max-w-[270px] bg-card/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl',
                className
              )}
            >
              {/* Content */}
              <div className="px-4 py-5 text-center">
                {icon && (
                  <div className="flex justify-center mb-3">
                    {icon}
                  </div>
                )}
                
                <h3 className="text-[17px] font-semibold text-foreground leading-tight">
                  {title}
                </h3>
                
                {message && (
                  <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">
                    {message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className={cn(
                'divide-y divide-border/50',
                actions.length === 2 && 'flex divide-y-0 divide-x'
              )}>
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={cn(
                      'flex-1 py-3 text-[17px] font-medium transition-all duration-150',
                      'active:bg-muted/50 disabled:opacity-40',
                      action.style === 'cancel' && 'font-semibold text-foreground',
                      action.style === 'destructive' && 'text-red-500 font-medium',
                      action.style === 'default' && 'text-primary font-normal'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for managing alert dialogs
export function useIOSAlertDialog() {
  const [alert, setAlert] = useState<{
    open: boolean
    title: string
    message?: string
    icon?: ReactNode
    actions: AlertAction[]
  }>({
    open: false,
    title: '',
    actions: []
  })

  const showAlert = (params: Omit<typeof alert, 'open'>) => {
    setAlert({ ...params, open: true })
  }

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }))
  }

  return {
    alert,
    showAlert,
    hideAlert
  }
}

// Preset alert configurations
export const alertPresets = {
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): Omit<IOSAlertDialogProps, 'open' | 'onClose'> => ({
    title,
    message,
    actions: [
      {
        label: 'Cancel',
        onAction: onCancel || (() => {}),
        style: 'cancel'
      },
      {
        label: 'Confirm',
        onAction: onConfirm,
        style: 'default'
      }
    ]
  }),

  delete: (
    title: string,
    message: string,
    onDelete: () => void,
    onCancel?: () => void
  ): Omit<IOSAlertDialogProps, 'open' | 'onClose'> => ({
    title,
    message,
    actions: [
      {
        label: 'Cancel',
        onAction: onCancel || (() => {}),
        style: 'cancel'
      },
      {
        label: 'Delete',
        onAction: onDelete,
        style: 'destructive'
      }
    ]
  }),

  ok: (
    title: string,
    message: string,
    onOk?: () => void
  ): Omit<IOSAlertDialogProps, 'open' | 'onClose'> => ({
    title,
    message,
    actions: [
      {
        label: 'OK',
        onAction: onOk || (() => {}),
        style: 'cancel'
      }
    ]
  })
}
