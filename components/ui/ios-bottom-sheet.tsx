'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

type Detent = 'small' | 'medium' | 'large' | 'full'

interface IOSBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
  detent?: Detent
  detents?: Detent[]
  showHandle?: boolean
  showCloseButton?: boolean
  dismissible?: boolean
  blurred?: boolean
  className?: string
}

const detentHeights: Record<Detent, string> = {
  small: '30%',
  medium: '50%',
  large: '75%',
  full: '95%'
}

export function IOSBottomSheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  detent = 'medium',
  detents,
  showHandle = true,
  showCloseButton = false,
  dismissible = true,
  blurred = true,
  className
}: IOSBottomSheetProps) {
  const [currentDetent, setCurrentDetent] = useState<Detent>(detent)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      triggerHaptic('light')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    if (dismissible) {
      triggerHaptic('light')
      onClose()
    }
  }

  const handleDragStart = (clientY: number) => {
    setIsDragging(true)
    setDragStartY(clientY)
    triggerHaptic('selection')
  }

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return

    const deltaY = clientY - dragStartY
    if (deltaY > 0) {
      setTranslateY(deltaY)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)

    if (translateY > 100) {
      handleClose()
    } else if (detents && detents.length > 1) {
      // Snap to nearest detent
      const currentIndex = detents.indexOf(currentDetent)
      if (translateY > 50 && currentIndex > 0) {
        setCurrentDetent(detents[currentIndex - 1])
        triggerHaptic('medium')
      }
    }

    setTranslateY(0)
    setDragStartY(0)
  }

  if (!isOpen) return null

  const sheet = (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-sm',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'relative w-full max-w-lg mx-auto',
          'bg-background rounded-t-[20px]',
          'shadow-[0_-2px_40px_rgba(0,0,0,0.15)]',
          'transition-transform duration-300 ease-out',
          blurred && 'backdrop-blur-xl bg-background/95',
          className
        )}
        style={{
          height: detentHeights[currentDetent],
          transform: `translateY(${translateY}px)`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        onMouseMove={(e) => isDragging && handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex-1">
              {title && (
                <h2 className="text-lg font-semibold">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className={cn(
                  'p-2 rounded-full',
                  'hover:bg-muted/50 active:scale-95',
                  'transition-all duration-200'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(sheet, document.body)
}

// Preset: List Bottom Sheet
export function IOSListBottomSheet({
  items,
  onSelect,
  ...props
}: Omit<IOSBottomSheetProps, 'children'> & {
  items: Array<{
    label: string
    value: string
    icon?: React.ReactNode
    destructive?: boolean
  }>
  onSelect: (value: string) => void
}) {
  return (
    <IOSBottomSheet {...props}>
      <div className="py-2">
        {items.map((item) => (
          <button
            key={item.value}
            onClick={() => {
              triggerHaptic('light')
              onSelect(item.value)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3',
              'active:bg-muted/50 transition-colors duration-200',
              item.destructive && 'text-red-500'
            )}
          >
            {item.icon && <div className="text-muted-foreground">{item.icon}</div>}
            <span className="text-base font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </IOSBottomSheet>
  )
}
