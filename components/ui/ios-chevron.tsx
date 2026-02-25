'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IOSChevronProps {
  className?: string
  direction?: 'left' | 'right' | 'up' | 'down'
}

export function IOSChevron({ className, direction = 'right' }: IOSChevronProps) {
  const rotation = {
    left: 'rotate-180',
    right: '',
    up: '-rotate-90',
    down: 'rotate-90',
  }[direction]

  return (
    <ChevronRight
      className={cn(
        'w-5 h-5 text-[#C7C7CC] dark:text-[#48484A] stroke-[2.5]',
        rotation,
        className
      )}
    />
  )
}
