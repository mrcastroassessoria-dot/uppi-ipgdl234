'use client'

import { useEffect, useRef, useCallback } from 'react'
import { triggerHaptic } from '@/hooks/use-haptic'

interface IOSConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
}

export function IOSConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
}: IOSConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleConfirm = useCallback(() => {
    triggerHaptic('impact')
    onConfirm()
  }, [onConfirm])

  useEffect(() => {
    if (open) triggerHaptic('warning')
  }, [open])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Dialog - iOS Action Sheet style */}
      <div className="relative w-full max-w-[calc(100%-2rem)] sm:max-w-[320px] mx-4 mb-4 sm:mb-0 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250">
        {/* Main card */}
        <div className="bg-white/95 dark:bg-[#1C1C1E]/95 ios-blur-heavy rounded-[16px] overflow-hidden shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_2px_20px_rgba(0,0,0,0.6)] border border-black/[0.04] dark:border-white/[0.08]">
          <div className="px-5 pt-5 pb-4 text-center">
            <h3 id="confirm-title" className="text-[17px] font-bold text-foreground leading-tight tracking-[-0.4px]">
              {title}
            </h3>
            {description && (
              <p className="text-[13px] text-[#8E8E93] mt-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <div className="border-t border-black/[0.08] dark:border-white/[0.1]">
            <button
              type="button"
              onClick={handleConfirm}
              className={`w-full py-3.5 text-[17px] font-semibold ios-list-press tracking-[-0.4px] ${
                variant === 'destructive'
                  ? 'text-[#FF3B30]'
                  : 'text-[#007AFF]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>

        {/* Cancel button - separate card for iOS feel */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2.5 bg-white/95 dark:bg-[#1C1C1E]/95 ios-blur-heavy rounded-[16px] py-3.5 text-[17px] font-bold text-[#007AFF] ios-list-press tracking-[-0.4px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_2px_20px_rgba(0,0,0,0.6)] border border-black/[0.04] dark:border-white/[0.08]"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}
