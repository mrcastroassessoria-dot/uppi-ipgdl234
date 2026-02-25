// iOS Native Animation Curves
export const iosAnimations = {
  // Standard iOS spring animation
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8
  },

  // Bouncy spring (like app icon press)
  bouncy: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 25,
    mass: 0.6
  },

  // Smooth spring (like sheet presentation)
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 35,
    mass: 1
  },

  // Quick response (like button tap)
  quick: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 40,
    mass: 0.5
  },

  // Ease in out (cubic bezier matching iOS)
  easeInOut: {
    type: 'tween' as const,
    duration: 0.3,
    ease: [0.42, 0, 0.58, 1]
  },

  // Ease out (for appearing elements)
  easeOut: {
    type: 'tween' as const,
    duration: 0.3,
    ease: [0, 0, 0.58, 1]
  },

  // Ease in (for disappearing elements)
  easeIn: {
    type: 'tween' as const,
    duration: 0.3,
    ease: [0.42, 0, 1, 1]
  },

  // Modal presentation
  modal: {
    type: 'spring' as const,
    stiffness: 350,
    damping: 35,
    mass: 1.2
  },

  // Sheet presentation
  sheet: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
    mass: 1
  }
}

// Animation variants for common iOS patterns
export const iosVariants = {
  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },

  // Scale in/out (like alert)
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  },

  // Slide up (like sheet)
  slideUp: {
    initial: { y: '100%', opacity: 1 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 1 }
  },

  // Slide down (like notification)
  slideDown: {
    initial: { y: '-100%', opacity: 1 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 1 }
  },

  // Slide right (navigation push)
  slideRight: {
    initial: { x: '100%', opacity: 1 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-30%', opacity: 0 }
  },

  // Slide left (navigation pop)
  slideLeft: {
    initial: { x: '-30%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 1 }
  },

  // Zoom in/out
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  },

  // Blur in/out
  blur: {
    initial: { filter: 'blur(10px)', opacity: 0 },
    animate: { filter: 'blur(0px)', opacity: 1 },
    exit: { filter: 'blur(10px)', opacity: 0 }
  }
}

// Gesture response animations
export const iosGestures = {
  // Tap response
  tap: {
    scale: 0.96,
    transition: iosAnimations.quick
  },

  // Long press
  longPress: {
    scale: 0.95,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20
    }
  },

  // Swipe threshold
  swipeThreshold: 50,

  // Swipe velocity threshold
  swipeVelocity: 500,

  // Drag elastic
  dragElastic: 0.2,

  // Drag momentum
  dragMomentum: true
}

// Timing values (in milliseconds)
export const iosTiming = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800
}

// Stagger animations
export const iosStagger = {
  // List items appearing
  list: {
    animate: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  },

  // Cards appearing
  cards: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },

  // Quick stagger
  quick: {
    animate: {
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.05
      }
    }
  }
}

// Helper to create custom spring animations
export function createSpringAnimation(
  stiffness: number = 400,
  damping: number = 30,
  mass: number = 0.8
) {
  return {
    type: 'spring' as const,
    stiffness,
    damping,
    mass
  }
}

// Helper to create custom tween animations
export function createTweenAnimation(
  duration: number = 0.3,
  ease: number[] = [0.42, 0, 0.58, 1]
) {
  return {
    type: 'tween' as const,
    duration,
    ease
  }
}

// Preset combinations for common UI elements
export const iosPresets = {
  button: {
    whileTap: { scale: 0.96 },
    transition: iosAnimations.quick
  },

  card: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: iosAnimations.spring
  },

  listItem: {
    whileTap: { scale: 0.98 },
    transition: iosAnimations.quick
  },

  modal: {
    initial: iosVariants.scale.initial,
    animate: iosVariants.scale.animate,
    exit: iosVariants.scale.exit,
    transition: iosAnimations.modal
  },

  sheet: {
    initial: iosVariants.slideUp.initial,
    animate: iosVariants.slideUp.animate,
    exit: iosVariants.slideUp.exit,
    transition: iosAnimations.sheet
  },

  notification: {
    initial: iosVariants.slideDown.initial,
    animate: iosVariants.slideDown.animate,
    exit: iosVariants.slideDown.exit,
    transition: iosAnimations.smooth
  }
}
