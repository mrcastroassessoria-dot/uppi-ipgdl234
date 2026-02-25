'use client'

import React from "react"

import { useState, useRef, useEffect, type TouchEvent } from 'react'
import { useHaptic } from './use-haptic'

export interface SwipeAction {
  label: string
  icon?: React.ReactNode
  color: string
  bgColor: string
  onTrigger: () => void | Promise<void>
}

interface UseSwipeActionsOptions {
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  threshold?: number // Distance to trigger action (px)
  maxSwipe?: number // Maximum swipe distance (px)
}

export function useSwipeActions(options: UseSwipeActionsOptions) {
  const { leftActions = [], rightActions = [], threshold = 80, maxSwipe = 200 } = options
  const { trigger } = useHaptic()
  
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isTriggered, setIsTriggered] = useState(false)
  const [activeAction, setActiveAction] = useState<SwipeAction | null>(null)
  
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return
    
    touchCurrentX.current = e.touches[0].clientX
    const diff = touchCurrentX.current - touchStartX.current
    
    // Limit swipe to maxSwipe
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff))
    setSwipeOffset(limitedDiff)
    
    // Determine active action
    const actions = diff > 0 ? leftActions : rightActions
    const distance = Math.abs(diff)
    
    if (distance >= threshold && actions.length > 0) {
      if (!isTriggered) {
        trigger('medium')
        setIsTriggered(true)
      }
      setActiveAction(actions[0])
    } else {
      if (isTriggered) {
        setIsTriggered(false)
      }
      setActiveAction(null)
    }
  }

  const handleTouchEnd = async () => {
    isDragging.current = false
    
    if (isTriggered && activeAction) {
      trigger('success')
      await activeAction.onTrigger()
    }
    
    // Reset
    setSwipeOffset(0)
    setIsTriggered(false)
    setActiveAction(null)
  }

  return {
    swipeOffset,
    isTriggered,
    activeAction,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}
