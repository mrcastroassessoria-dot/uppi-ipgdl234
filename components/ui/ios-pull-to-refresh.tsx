'use client'

import React, { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSPullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  className?: string
  disabled?: boolean
}

export function IOSPullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
  disabled = false
}: IOSPullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const scrollTop = containerRef.current?.scrollTop || window.scrollY
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0) {
      // Apply rubber band effect
      const rubberBandDistance = Math.pow(distance, 0.85)
      setPullDistance(rubberBandDistance)

      if (rubberBandDistance >= threshold && !canRefresh) {
        triggerHaptic('medium')
        setCanRefresh(true)
      } else if (rubberBandDistance < threshold && canRefresh) {
        setCanRefresh(false)
      }
    }
  }

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return

    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true)
      triggerHaptic('success')
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setCanRefresh(false)
      }
    }

    setPullDistance(0)
    startY.current = 0
  }

  useEffect(() => {
    if (!isRefreshing) {
      setPullDistance(0)
    }
  }, [isRefreshing])

  const rotation = Math.min((pullDistance / threshold) * 360, 360)
  const scale = Math.min(pullDistance / threshold, 1)

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-opacity duration-200"
        style={{
          transform: `translate(-50%, ${Math.min(pullDistance - 40, 0)}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            transform: `scale(${scale})`,
          }}
        >
          {isRefreshing ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-6 h-6 text-primary transition-transform duration-200"
              style={{ transform: `rotate(${rotation}deg)` }}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${isRefreshing ? 60 : Math.min(pullDistance * 0.5, 60)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
