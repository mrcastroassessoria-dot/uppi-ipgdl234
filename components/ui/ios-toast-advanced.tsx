'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { haptics } from '@/lib/utils/ios-haptics'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'
type ToastPosition = 'top' | 'center' | 'bottom'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  position?: ToastPosition
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  hideToast: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  loading: (message: string) => string
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useIOSToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useIOSToast must be used within IOSToastProvider')
  }
  return context
}

export function IOSToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      position: 'bottom',
      duration: 3000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Haptic feedback based on type
    switch (toast.type) {
      case 'success':
        haptics.trigger('success')
        break
      case 'error':
        haptics.trigger('error')
        break
      case 'warning':
        haptics.trigger('warning')
        break
      default:
        haptics.trigger('light')
    }

    // Auto-hide (except loading)
    if (toast.type !== 'loading' && newToast.duration) {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'success', duration })
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'error', duration })
  }, [showToast])

  const warning = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'warning', duration })
  }, [showToast])

  const info = useCallback((message: string, duration?: number) => {
    return showToast({ message, type: 'info', duration })
  }, [showToast])

  const loading = useCallback((message: string) => {
    return showToast({ message, type: 'loading' })
  }, [showToast])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        success,
        error,
        warning,
        info,
        loading,
      }}
    >
      {children}
      {typeof window !== 'undefined' && createPortal(
        <ToastContainer toasts={toasts} onDismiss={hideToast} />,
        document.body
      )}
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const topToasts = toasts.filter((t) => t.position === 'top')
  const centerToasts = toasts.filter((t) => t.position === 'center')
  const bottomToasts = toasts.filter((t) => t.position === 'bottom')

  return (
    <>
      {/* Top toasts */}
      {topToasts.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pt-[calc(env(safe-area-inset-top)+1rem)] px-4 pointer-events-none">
          {topToasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </div>
      )}

      {/* Center toasts */}
      {centerToasts.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-2 px-4 pointer-events-none">
          {centerToasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </div>
      )}

      {/* Bottom toasts */}
      {bottomToasts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pb-[calc(env(safe-area-inset-bottom)+5rem)] px-4 pointer-events-none">
          {bottomToasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const typeConfig = {
    success: {
      bg: 'bg-[#34C759]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-[#FF3B30]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-[#FF9500]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-[#007AFF]',
      icon: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
    loading: {
      bg: 'bg-black/80 dark:bg-white/80',
      icon: (
        <svg className="w-5 h-5 text-white dark:text-black animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ),
    },
  }

  const config = typeConfig[toast.type]

  return (
    <div
      className="pointer-events-auto max-w-[90vw] animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{ animationFillMode: 'forwards' }}
    >
      <div className={`
        ${config.bg}
        rounded-[16px] px-4 py-3 flex items-center gap-3
        shadow-[0_8px_32px_rgba(0,0,0,0.24)]
        ios-blur-heavy
        min-w-[200px] max-w-[400px]
      `}>
        {toast.icon || config.icon}
        <span className="flex-1 text-[15px] font-semibold text-white dark:text-black tracking-[-0.2px]">
          {toast.message}
        </span>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              haptics.trigger('light')
              toast.action?.onClick()
              onDismiss(toast.id)
            }}
            className="text-[15px] font-bold text-white/90 dark:text-black/90 uppercase tracking-wide ios-press"
          >
            {toast.action.label}
          </button>
        )}
        {toast.type !== 'loading' && !toast.action && (
          <button
            type="button"
            onClick={() => {
              haptics.trigger('selection')
              onDismiss(toast.id)
            }}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors ios-press"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
