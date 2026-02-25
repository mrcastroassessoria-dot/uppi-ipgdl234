'use client'

import { useState, useRef, useCallback, type TouchEvent } from 'react'
import { useHaptic } from './use-haptic'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number // Distance to trigger refresh (px)
  maxPull?: number // Maximum pull distance (px)
  resistance?: number // Pull resistance factor (0-1)
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, maxPull = 150, resistance = 0.5 } = options
  const { trigger } = useHaptic()
  
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)
  const scrollTop = useRef(0)
  const isPulling = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const element = e.currentTarget as HTMLElement
    scrollTop.current = element.scrollTop
    
    // Only allow pull to refresh when at the top
    if (scrollTop.current === 0) {
      touchStartY.current = e.touches[0].clientY
      touchCurrentY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return
    
    const element = e.currentTarget as HTMLElement
    if (element.scrollTop > 0) {
      isPulling.current = false
      return
    }
    
    touchCurrentY.current = e.touches[0].clientY
    const diff = touchCurrentY.current - touchStartY.current
    
    // Only pull down
    if (diff > 0) {
      // Apply resistance
      const resistedDiff = diff * resistance
      const limitedDiff = Math.min(maxPull, resistedDiff)
      
      setPullDistance(limitedDiff)
      
      // Trigger haptic when threshold is reached
      if (limitedDiff >= threshold && !canRefresh) {
        trigger('medium')
        setCanRefresh(true)
      } else if (limitedDiff < threshold && canRefresh) {
        setCanRefresh(false)
      }
    }
  }, [isRefreshing, threshold, maxPull, resistance, canRefresh, trigger])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return
    
    isPulling.current = false
    
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true)
      trigger('success')
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('[v0] Pull to refresh error:', error)
      } finally {
        setIsRefreshing(false)
        setCanRefresh(false)
      }
    }
    
    setPullDistance(0)
  }, [canRefresh, isRefreshing, onRefresh, trigger])

  const pullProgress = Math.min(1, pullDistance / threshold)

  return {
    pullDistance,
    pullProgress,
    isRefreshing,
    canRefresh,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}
