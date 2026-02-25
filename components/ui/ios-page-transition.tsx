'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface IOSPageTransitionProps {
  children: ReactNode
  direction?: 'forward' | 'back'
  type?: 'slide' | 'fade' | 'scale' | 'modal'
  className?: string
}

export function IOSPageTransition({
  children,
  direction = 'forward',
  type = 'slide',
  className
}: IOSPageTransitionProps) {
  const pathname = usePathname()

  const slideVariants = {
    initial: {
      x: direction === 'forward' ? '100%' : '-30%',
      opacity: direction === 'forward' ? 1 : 0
    },
    animate: {
      x: 0,
      opacity: 1
    },
    exit: {
      x: direction === 'forward' ? '-30%' : '100%',
      opacity: direction === 'forward' ? 0 : 1
    }
  }

  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const scaleVariants = {
    initial: {
      scale: 0.95,
      opacity: 0
    },
    animate: {
      scale: 1,
      opacity: 1
    },
    exit: {
      scale: 0.95,
      opacity: 0
    }
  }

  const modalVariants = {
    initial: {
      y: '100%',
      opacity: 1
    },
    animate: {
      y: 0,
      opacity: 1
    },
    exit: {
      y: '100%',
      opacity: 1
    }
  }

  const variants = {
    slide: slideVariants,
    fade: fadeVariants,
    scale: scaleVariants,
    modal: modalVariants
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants[type]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 40,
          mass: 0.8
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Stack navigation transition (like iOS NavigationController)
export function IOSStackTransition({ children }: { children: ReactNode }) {
  return (
    <IOSPageTransition type="slide" direction="forward">
      {children}
    </IOSPageTransition>
  )
}

// Modal presentation transition
export function IOSModalTransition({ children }: { children: ReactNode }) {
  return (
    <IOSPageTransition type="modal" direction="forward">
      {children}
    </IOSPageTransition>
  )
}

// Crossfade transition
export function IOSCrossfadeTransition({ children }: { children: ReactNode }) {
  return (
    <IOSPageTransition type="fade" direction="forward">
      {children}
    </IOSPageTransition>
  )
}
