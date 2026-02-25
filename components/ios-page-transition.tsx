'use client'

import React from "react"

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

interface IOSPageTransitionProps {
  children: React.ReactNode
}

export function IOSPageTransition({ children }: IOSPageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setIsTransitioning(true)
      // Quick fade, then swap content
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setIsTransitioning(false)
        prevPathname.current = pathname
      }, 80)
      return () => clearTimeout(timer)
    }
    setDisplayChildren(children)
  }, [pathname, children])

  return (
    <div
      className="h-full w-full"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translate3d(8px, 0, 0) scale(0.995)' : 'translate3d(0, 0, 0) scale(1)',
        transition: 'opacity 0.18s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.22s cubic-bezier(0.25, 0.1, 0.25, 1)',
        willChange: 'opacity, transform',
      }}
    >
      {displayChildren}
    </div>
  )
}
