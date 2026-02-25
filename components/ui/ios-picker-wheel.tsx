'use client'

import { cn } from '@/lib/utils'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSPickerWheelProps<T> {
  items: T[]
  value: T
  onChange: (value: T) => void
  renderItem?: (item: T) => string
  itemHeight?: number
  visibleItems?: number
  loop?: boolean
  className?: string
}

export function IOSPickerWheel<T>({
  items,
  value,
  onChange,
  renderItem = (item) => String(item),
  itemHeight = 44,
  visibleItems = 5,
  loop = true,
  className
}: IOSPickerWheelProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(
    items.findIndex((item) => item === value)
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const isDragging = useRef(false)
  const lastHapticIndex = useRef(selectedIndex)

  const totalHeight = items.length * itemHeight
  const containerHeight = visibleItems * itemHeight

  useEffect(() => {
    const index = items.findIndex((item) => item === value)
    if (index !== -1 && index !== selectedIndex) {
      setSelectedIndex(index)
      const targetY = -index * itemHeight
      animate(y, targetY, {
        type: 'spring',
        stiffness: 300,
        damping: 30
      })
    }
  }, [value, items, itemHeight, selectedIndex, y])

  const handleDragEnd = () => {
    isDragging.current = false
    const currentY = y.get()
    const index = Math.round(-currentY / itemHeight)
    const clampedIndex = loop
      ? ((index % items.length) + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, index))

    setSelectedIndex(clampedIndex)
    onChange(items[clampedIndex])

    const targetY = -clampedIndex * itemHeight
    animate(y, targetY, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    })
  }

  const handleDrag = () => {
    if (!isDragging.current) {
      isDragging.current = true
    }

    const currentY = y.get()
    const currentIndex = Math.round(-currentY / itemHeight)
    const normalizedIndex = loop
      ? ((currentIndex % items.length) + items.length) % items.length
      : Math.max(0, Math.min(items.length - 1, currentIndex))

    if (normalizedIndex !== lastHapticIndex.current) {
      triggerHaptic('selection')
      lastHapticIndex.current = normalizedIndex
    }
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height: containerHeight }}>
      {/* Selection indicator */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-10 border-y border-border/50"
        style={{
          top: (visibleItems - 1) / 2 * itemHeight,
          height: itemHeight
        }}
      />

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      {/* Items container */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{
          top: loop ? -Infinity : -(items.length - 1) * itemHeight,
          bottom: loop ? Infinity : 0
        }}
        dragElastic={0.1}
        dragMomentum={true}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="relative"
      >
        {items.map((item, index) => {
          const offset = useTransform(
            y,
            [
              -(index + 1) * itemHeight,
              -index * itemHeight,
              -(index - 1) * itemHeight
            ],
            [0.5, 1, 0.5]
          )

          const scale = useTransform(
            y,
            [
              -(index + 1) * itemHeight,
              -index * itemHeight,
              -(index - 1) * itemHeight
            ],
            [0.8, 1, 0.8]
          )

          return (
            <motion.button
              key={index}
              onClick={() => {
                setSelectedIndex(index)
                onChange(items[index])
                triggerHaptic('selection')
                const targetY = -index * itemHeight
                animate(y, targetY, {
                  type: 'spring',
                  stiffness: 300,
                  damping: 30
                })
              }}
              style={{
                height: itemHeight,
                opacity: offset,
                scale
              }}
              className={cn(
                'w-full flex items-center justify-center text-lg font-medium',
                'transition-colors duration-150',
                index === selectedIndex ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {renderItem(item)}
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}

// Multi-column picker (like iOS time picker)
interface IOSMultiPickerProps {
  columns: Array<{
    items: any[]
    value: any
    onChange: (value: any) => void
    renderItem?: (item: any) => string
    suffix?: string
  }>
  className?: string
}

export function IOSMultiPicker({ columns, className }: IOSMultiPickerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {columns.map((column, index) => (
        <div key={index} className="flex items-center gap-2">
          <IOSPickerWheel
            items={column.items}
            value={column.value}
            onChange={column.onChange}
            renderItem={column.renderItem}
            className="flex-1"
          />
          {column.suffix && (
            <span className="text-lg font-medium text-foreground">
              {column.suffix}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
