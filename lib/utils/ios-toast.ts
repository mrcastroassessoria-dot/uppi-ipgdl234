'use client'

import { toast } from 'sonner'
import { triggerHaptic } from '@/hooks/use-haptic'

/**
 * iOS-style toast utilities with haptic feedback and action buttons.
 * 
 * Usage:
 *   iosToast.success('Corrida aceita!', { action: { label: 'Ver', onClick: () => {} } })
 *   iosToast.undoable('Corrida cancelada', onUndo)
 *   iosToast.rideUpdate('Motorista chegou!', { rideId: '123' })
 */

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastOptions {
  description?: string
  action?: ToastAction
  cancel?: ToastAction
  duration?: number
}

export const iosToast = {
  success(message: string, options?: ToastOptions) {
    triggerHaptic('success')
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
      cancel: options?.cancel
        ? { label: options.cancel.label, onClick: options.cancel.onClick }
        : undefined,
    })
  },

  error(message: string, options?: ToastOptions) {
    triggerHaptic('error')
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },

  info(message: string, options?: ToastOptions) {
    triggerHaptic('light')
    return toast(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },

  warning(message: string, options?: ToastOptions) {
    triggerHaptic('warning')
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },

  /**
   * Toast with undo action - shows for 5 seconds
   * @param message The message to display
   * @param onUndo Callback when user clicks "Desfazer"
   * @param onTimeout Optional callback when toast times out without undo
   */
  undoable(message: string, onUndo: () => void, onTimeout?: () => void) {
    triggerHaptic('medium')
    let wasUndone = false

    const id = toast(message, {
      duration: 5000,
      action: {
        label: 'Desfazer',
        onClick: () => {
          wasUndone = true
          triggerHaptic('success')
          onUndo()
          toast.dismiss(id)
        },
      },
      onDismiss: () => {
        if (!wasUndone) onTimeout?.()
      },
      onAutoClose: () => {
        if (!wasUndone) onTimeout?.()
      },
    })

    return id
  },

  /**
   * Ride-specific toast notifications
   */
  rideUpdate(message: string, options?: { description?: string; rideId?: string; onView?: () => void }) {
    triggerHaptic('medium')
    return toast(message, {
      description: options?.description,
      duration: 4000,
      action: options?.onView
        ? { label: 'Ver', onClick: options.onView }
        : undefined,
    })
  },

  /**
   * Loading toast that resolves to success or error
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
  },

  /** Dismiss a specific toast or all toasts */
  dismiss(id?: string | number) {
    toast.dismiss(id)
  },
}
