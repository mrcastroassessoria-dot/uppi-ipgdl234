'use client'

import React, { useEffect, useState } from 'react'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface NavigationAction {
  icon?: React.ReactNode
  label?: string
  onClick: () => void
  destructive?: boolean
}

interface IOSNavigationBarProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  leftAction?: NavigationAction
  rightActions?: NavigationAction[]
  transparent?: boolean
  blurred?: boolean
  large?: boolean
  className?: string
  children?: React.ReactNode
}

export function IOSNavigationBar({
  title,
  subtitle,
  showBackButton,
  onBack,
  leftAction,
  rightActions = [],
  transparent = false,
  blurred = true,
  large = false,
  className,
  children
}: IOSNavigationBarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleActionClick = (action: () => void) => {
    triggerHaptic('light')
    action()
  }

  return (
    <div
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        transparent && !scrolled ? 'bg-transparent' : 'bg-white/80 dark:bg-black/80',
        blurred && 'backdrop-blur-xl',
        scrolled && 'shadow-sm',
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div
        className={cn(
          'flex items-center justify-between px-4 transition-all duration-300',
          large ? 'h-16' : 'h-14'
        )}
      >
        {/* Left Section */}
        <div className="flex-1 flex items-center">
          {showBackButton && (
            <button
              onClick={() => {
                handleActionClick(onBack || (() => window.history.back()))
              }}
              className={cn(
                'flex items-center gap-1 -ml-2 px-2 py-1 rounded-lg',
                'text-primary font-medium',
                'active:scale-95 active:bg-primary/10',
                'transition-all duration-200'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-base">Voltar</span>
            </button>
          )}
          {leftAction && (
            <button
              onClick={() => handleActionClick(leftAction.onClick)}
              className={cn(
                'flex items-center gap-2 -ml-2 px-3 py-1.5 rounded-lg',
                'text-primary font-medium',
                'active:scale-95 active:bg-primary/10',
                'transition-all duration-200'
              )}
            >
              {leftAction.icon}
              {leftAction.label && (
                <span className="text-base">{leftAction.label}</span>
              )}
            </button>
          )}
        </div>

        {/* Center Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {title && (
            <h1
              className={cn(
                'font-semibold transition-all duration-300 text-center',
                large ? 'text-xl' : 'text-base',
                scrolled ? 'opacity-100' : transparent ? 'opacity-0' : 'opacity-100'
              )}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Right Section */}
        <div className="flex-1 flex items-center justify-end gap-2">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action.onClick)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'font-medium',
                action.destructive
                  ? 'text-red-500'
                  : 'text-primary',
                'active:scale-95 active:bg-primary/10',
                'transition-all duration-200'
              )}
            >
              {action.icon}
              {action.label && (
                <span className="text-base">{action.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Large Title */}
      {large && title && (
        <div
          className={cn(
            'px-4 pb-3 transition-all duration-300',
            scrolled ? 'opacity-0 h-0' : 'opacity-100'
          )}
        >
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
      )}

      {/* Custom Content */}
      {children && (
        <div className="px-4 pb-2">
          {children}
        </div>
      )}
    </div>
  )
}

// Preset Configurations
export function IOSNavigationBarWithSearch({
  title,
  onSearch,
  ...props
}: IOSNavigationBarProps & { onSearch?: (query: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <IOSNavigationBar title={title} {...props}>
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            onSearch?.(e.target.value)
          }}
          className={cn(
            'w-full h-9 pl-9 pr-4 rounded-lg',
            'bg-black/5 dark:bg-white/5',
            'text-sm placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'transition-all duration-200'
          )}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </IOSNavigationBar>
  )
}
