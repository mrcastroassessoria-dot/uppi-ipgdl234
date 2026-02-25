'use client'

import React from "react"

import { useSwipeActions, type SwipeAction } from '@/hooks/use-swipe-actions'

interface SwipeableListItemProps {
  children: React.ReactNode
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  className?: string
}

export function SwipeableListItem({ 
  children, 
  leftActions = [], 
  rightActions = [],
  className = ''
}: SwipeableListItemProps) {
  const { swipeOffset, isTriggered, activeAction, handlers } = useSwipeActions({
    leftActions,
    rightActions,
    threshold: 80,
    maxSwipe: 200,
  })

  const showLeftActions = swipeOffset > 0
  const showRightActions = swipeOffset < 0

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Actions Background */}
      {showLeftActions && leftActions.length > 0 && (
        <div 
          className="absolute inset-y-0 left-0 flex items-center px-4 transition-opacity"
          style={{ 
            backgroundColor: isTriggered && activeAction ? activeAction.bgColor : leftActions[0].bgColor,
            opacity: Math.min(1, Math.abs(swipeOffset) / 80),
            width: Math.abs(swipeOffset)
          }}
        >
          <div className="flex items-center gap-2" style={{ color: leftActions[0].color }}>
            {leftActions[0].icon}
            <span className="font-semibold text-sm">{leftActions[0].label}</span>
          </div>
        </div>
      )}

      {/* Right Actions Background */}
      {showRightActions && rightActions.length > 0 && (
        <div 
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity"
          style={{ 
            backgroundColor: isTriggered && activeAction ? activeAction.bgColor : rightActions[0].bgColor,
            opacity: Math.min(1, Math.abs(swipeOffset) / 80),
            width: Math.abs(swipeOffset)
          }}
        >
          <div className="flex items-center gap-2" style={{ color: rightActions[0].color }}>
            <span className="font-semibold text-sm">{rightActions[0].label}</span>
            {rightActions[0].icon}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        {...handlers}
        className="relative bg-card transition-transform touch-pan-y"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
