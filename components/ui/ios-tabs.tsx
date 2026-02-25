'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ReactNode, useState, createContext, useContext } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface IOSTabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function IOSTabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className
}: IOSTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeTab = controlledValue ?? internalValue

  const setActiveTab = (value: string) => {
    if (controlledValue === undefined) {
      setInternalValue(value)
    }
    onValueChange?.(value)
    triggerHaptic('selection')
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface IOSTabsListProps {
  children: ReactNode
  variant?: 'default' | 'segmented'
  className?: string
}

export function IOSTabsList({
  children,
  variant = 'default',
  className
}: IOSTabsListProps) {
  if (variant === 'segmented') {
    return (
      <div className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg',
        'bg-muted p-1',
        className
      )}>
        {children}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center gap-6 border-b border-border overflow-x-auto',
      'scrollbar-hide',
      className
    )}>
      {children}
    </div>
  )
}

interface IOSTabsTriggerProps {
  value: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

export function IOSTabsTrigger({
  value,
  children,
  disabled = false,
  className
}: IOSTabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('IOSTabsTrigger must be used within IOSTabs')

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value
  const isSegmented = className?.includes('segmented')

  if (isSegmented) {
    return (
      <button
        onClick={() => !disabled && setActiveTab(value)}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center justify-center whitespace-nowrap',
          'rounded-md px-3 py-1 text-sm font-medium',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:pointer-events-none disabled:opacity-50',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground',
          className
        )}
      >
        {isActive && (
          <motion.div
            layoutId="segmented-indicator"
            className="absolute inset-0 bg-background rounded-md shadow-sm"
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30
            }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap',
        'px-1 pb-3 text-sm font-medium',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30
          }}
        />
      )}
    </button>
  )
}

interface IOSTabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function IOSTabsContent({
  value,
  children,
  className
}: IOSTabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('IOSTabsContent must be used within IOSTabs')

  const { activeTab } = context
  const isActive = activeTab === value

  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30
      }}
      className={cn('mt-4', className)}
    >
      {children}
    </motion.div>
  )
}
