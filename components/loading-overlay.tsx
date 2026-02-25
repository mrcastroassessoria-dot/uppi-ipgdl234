'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MorphingSpinner } from '@/components/ui/morphing-spinner'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md ios-blur-heavy"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl rounded-[28px] p-8 shadow-2xl border border-black/[0.08] dark:border-white/[0.08] min-w-[200px] max-w-[300px]"
          >
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <MorphingSpinner size="lg" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ 
                    repeat: Number.POSITIVE_INFINITY, 
                    duration: 2,
                    ease: 'easeInOut'
                  }}
                  className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl -z-10"
                />
              </div>
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[15px] font-semibold text-foreground text-center tracking-tight leading-snug"
                >
                  {message}
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
