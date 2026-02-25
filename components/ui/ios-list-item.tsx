'use client'

import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { motion, PanInfo } from 'framer-motion'
import { useState, ReactNode } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface SwipeAction {
  label: string
  icon?: ReactNode
  color: 'red' | 'blue' | 'green' | 'orange'
  onAction: () => void
}

interface IOSListItemProps {
  children: ReactNode
  onClick?: () => void
  showChevron?: boolean
  subtitle?: string
  leftIcon?: ReactNode
  rightContent?: ReactNode
  badge?: string | number
  swipeActions?: SwipeAction[]
  inset?: boolean
  className?: string
}

const actionColors = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500'
}

export function IOSListItem({
  children,
  onClick,
  showChevron = false,
  subtitle,
  leftIcon,
  rightContent,
  badge,
  swipeActions = [],
  inset = false,
  className
}: IOSListItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isPressed, setIsPressed] = useState(false)

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80
    const velocity = info.velocity.x

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x < 0 ? -1 : 1
      const totalActionsWidth = swipeActions.length * 80
      setSwipeOffset(direction * totalActionsWidth)
      triggerHaptic('selection')
    } else {
      setSwipeOffset(0)
    }
  }

  const executeAction = (action: SwipeAction) => {
    triggerHaptic('impact', 'medium')
    action.onAction()
    setSwipeOffset(0)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      {swipeActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex">
          {swipeActions.map((action, index) => (
            <button
              key={index}
              onClick={() => executeAction(action)}
              className={cn(
                'flex items-center justify-center w-20 text-white font-medium text-sm',
                actionColors[action.color]
              )}
              style={{
                transform: `translateX(${Math.max(0, swipeOffset)}px)`
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {action.icon}
                <span>{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <motion.div
        drag={swipeActions.length > 0 ? 'x' : false}
        dragConstraints={{ left: -swipeActions.length * 80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: swipeOffset }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        className="relative bg-background"
      >
        <button
          onClick={() => {
            if (onClick) {
              triggerHaptic('selection')
              onClick()
            }
          }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left',
            'transition-all duration-150',
            'active:scale-[0.98] active:bg-muted/50',
            isPressed && 'bg-muted/50',
            inset && 'pl-16',
            onClick && 'cursor-pointer',
            className
          )}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div className="flex-shrink-0 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-foreground truncate">
                {children}
              </span>
              {badge && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Content */}
          {rightContent && (
            <div className="flex-shrink-0 text-muted-foreground">
              {rightContent}
            </div>
          )}

          {/* Chevron */}
          {showChevron && (
            <ChevronRight className="flex-shrink-0 w-5 h-5 text-muted-foreground/50" />
          )}
        </button>
      </motion.div>
    </div>
  )
}

interface IOSListGroupProps {
  children: ReactNode
  title?: string
  footer?: string
  className?: string
}

export function IOSListGroup({ children, title, footer, className }: IOSListGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <div className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </div>
      )}
      <div className="bg-card rounded-xl overflow-hidden divide-y divide-border">
        {children}
      </div>
      {footer && (
        <div className="px-4 text-xs text-muted-foreground leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  )
}
