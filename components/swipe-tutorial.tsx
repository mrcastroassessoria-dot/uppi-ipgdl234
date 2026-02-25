'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export function SwipeTutorial() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenSwipeTutorial')
    if (!hasSeenTutorial) {
      setTimeout(() => setShow(true), 1000)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('hasSeenSwipeTutorial', 'true')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl px-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full rounded-[32px] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl p-8 shadow-2xl border border-black/[0.08] dark:border-white/[0.08]"
          >
            {/* Hand Swipe Animation */}
            <div className="mb-6 flex justify-center relative h-20">
              <motion.div
                animate={{
                  x: [-30, 30, -30],
                  rotate: [-15, 15, -15]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-7xl filter drop-shadow-lg"
              >
                👉
              </motion.div>
              <motion.div
                animate={{
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/20 blur-xl" />
              </motion.div>
            </div>

            {/* Title */}
            <h3 className="mb-3 text-center text-[26px] font-bold text-foreground tracking-tight">
              Deslize para explorar
            </h3>

            {/* Description */}
            <p className="mb-8 text-center text-[15px] text-[#8E8E93] leading-relaxed">
              Arraste os cartões para a esquerda ou direita para ver as opções disponíveis
            </p>

            {/* Got It Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDismiss}
              className="w-full rounded-[16px] bg-gradient-to-r from-[#007AFF] to-[#0A84FF] py-4 text-[17px] font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-shadow"
            >
              Entendi!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
