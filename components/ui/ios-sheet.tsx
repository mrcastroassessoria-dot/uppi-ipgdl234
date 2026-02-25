'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { haptics } from '@/lib/utils/ios-haptics'

interface IOSSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  detents?: ('medium' | 'large')[]
  selectedDetent?: 'medium' | 'large'
  showHandle?: boolean
  dismissible?: boolean
}

export function IOSSheet({
  isOpen,
  onClose,
  children,
  title,
  detents = ['large'],
  selectedDetent = 'large',
  showHandle = true,
  dismissible = true,
}: IOSSheetProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [currentDetent, setCurrentDetent] = useState(selectedDetent)
  const startY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const detentHeights = {
    medium: '50dvh',
    large: '90dvh',
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      haptics.trigger('light')
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!dismissible && detents.length <= 1) return
    
    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    // Only allow dragging down or up within limits
    if (diff > 0 || (diff < 0 && currentDetent === 'medium')) {
      setDragOffset(diff)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Dismiss if dragged down more than 100px
    if (dismissible && dragOffset > 100) {
      haptics.trigger('light')
      onClose()
    } 
    // Switch to medium if dragged down
    else if (dragOffset > 50 && currentDetent === 'large' && detents.includes('medium')) {
      haptics.trigger('selection')
      setCurrentDetent('medium')
    }
    // Switch to large if dragged up
    else if (dragOffset < -50 && currentDetent === 'medium' && detents.includes('large')) {
      haptics.trigger('selection')
      setCurrentDetent('large')
    }

    setDragOffset(0)
  }

  if (!isOpen) return null

  const sheetHeight = detentHeights[currentDetent]
  const transform = isDragging ? `translateY(${Math.max(0, dragOffset)}px)` : 'translateY(0)'

  return typeof window !== 'undefined' ? createPortal(
    <div
      className="fixed inset-0 z-[9998] animate-in fade-in duration-200"
      onClick={dismissible ? onClose : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 ios-blur-heavy" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-[#F2F2F7]/98 dark:bg-[#1C1C1E]/98 ios-blur-heavy rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.16)] dark:shadow-[0_-8px_48px_rgba(0,0,0,0.6)] border-t border-black/[0.06] dark:border-white/[0.08] animate-in slide-in-from-bottom duration-400"
        style={{
          height: sheetHeight,
          transform,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle area */}
        <div className="flex flex-col items-center pt-3 pb-2">
          {showHandle && (
            <div className="w-9 h-[4px] bg-black/[0.15] dark:bg-white/[0.2] rounded-full" />
          )}
        </div>

        {/* Title */}
        {title && (
          <div className="px-5 pb-4">
            <h2 className="text-[22px] font-bold text-foreground tracking-[-0.5px]">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto ios-scroll px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  ) : null
}

interface IOSSheetHeaderProps {
  children: React.ReactNode
  className?: string
}

export function IOSSheetHeader({ children, className = '' }: IOSSheetHeaderProps) {
  return (
    <div className={`px-5 pb-4 ${className}`}>
      {children}
    </div>
  )
}

export function IOSSheetTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[28px] font-bold text-foreground tracking-[-0.6px] ${className}`}>
      {children}
    </h2>
  )
}

export function IOSSheetDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[15px] text-[#8E8E93] mt-1 leading-snug ${className}`}>
      {children}
    </p>
  )
}

export function IOSSheetFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`sticky bottom-0 left-0 right-0 px-5 py-4 bg-[#F2F2F7]/95 dark:bg-[#1C1C1E]/95 ios-blur-heavy border-t border-black/[0.06] dark:border-white/[0.08] ${className}`}>
      {children}
    </div>
  )
}
