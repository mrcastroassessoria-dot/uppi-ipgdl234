'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { triggerHaptic } from '@/hooks/use-haptic'

interface IOSPullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  threshold?: number
  className?: string
}

export function IOSPullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className = '',
}: IOSPullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = (e: TouchEvent) => {
    const container = containerRef.current
    if (!container || container.scrollTop > 0) return
    
    startY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || isRefreshing) return

    const container = containerRef.current
    if (!container || container.scrollTop > 0) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY.current)
    
    // Apply rubber band effect
    const rubberBandDistance = Math.min(distance * 0.5, threshold * 1.5)
    setPullDistance(rubberBandDistance)

    if (rubberBandDistance >= threshold) {
      triggerHaptic('impact')
    }

    // Prevent scroll when pulling
    if (distance > 10) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (!isDragging.current) return
    isDragging.current = false

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      triggerHaptic('success')
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, isRefreshing])

  const spinnerRotation = isRefreshing ? 360 : (pullDistance / threshold) * 360
  const spinnerOpacity = Math.min(pullDistance / threshold, 1)

  return (
    <div ref={containerRef} className={`relative overflow-y-auto ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50 transition-transform duration-200"
        style={{
          transform: `translateY(${Math.min(pullDistance - 50, 0)}px)`,
        }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full bg-card/80 ios-blur-heavy border border-border/50 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          style={{
            opacity: spinnerOpacity,
            transform: `rotate(${spinnerRotation}deg)`,
            transition: isRefreshing ? 'transform 1s linear' : 'transform 0.2s ease-out',
          }}
        >
          <svg
            className="w-5 h-5 text-[#007AFF]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      </div>

      {children}
    </div>
  )
}
