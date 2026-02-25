'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, Car } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Step {
  icon: React.ReactNode
  text: React.ReactNode
}

export interface ReferralCardProps {
  badgeText: string
  title: string
  description: string
  steps: Step[]
  referralLink: string
  className?: string
}

export const ReferralCard = ({
  badgeText,
  title,
  description,
  steps,
  referralLink,
  className,
}: ReferralCardProps) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      
      // Trigger confetti animation
      const duration = 2000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)
      
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={cn(
        'relative w-full overflow-hidden rounded-[28px] bg-card border border-border shadow-[0_2px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {/* Header com gradiente e ícone de carro */}
      <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-8 pb-16 overflow-hidden">
        {/* Ícone de carro decorativo */}
        <div className="absolute right-6 top-6 opacity-20">
          <Car className="w-24 h-24 text-white" strokeWidth={1.5} />
        </div>
        
        <div className="relative z-10">
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="mb-3 inline-block rounded-full bg-white/20 backdrop-blur-sm px-3.5 py-1.5 text-[13px] font-semibold text-white"
          >
            {badgeText}
          </motion.div>

          {/* Title */}
          <motion.h2
            variants={itemVariants}
            className="mb-2 text-[32px] font-bold tracking-tight text-white leading-tight"
          >
            {title}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-[17px] text-white/90 font-medium">
            {description}
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* How it works section */}
        <div className="mb-6">
          <motion.h3 variants={itemVariants} className="mb-4 text-[17px] font-bold text-foreground">
            Como funciona:
          </motion.h3>
          <motion.ul
            className="space-y-3"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.15, delayChildren: 0.3 }}
          >
            {steps.map((step, index) => (
              <motion.li key={index} variants={itemVariants} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mt-0.5">
                  {step.icon}
                </span>
                <span className="text-[15px] text-muted-foreground leading-relaxed flex-1">{step.text}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Invite link section */}
        <div>
          <motion.h3 variants={itemVariants} className="mb-3 text-[17px] font-bold text-foreground">
            Seu link de convite:
          </motion.h3>
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-2"
          >
            <div className="flex h-[52px] items-center gap-2 rounded-[14px] border border-border bg-secondary px-4">
              <Car className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="truncate text-[15px] text-foreground flex-1 font-mono">{referralLink}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full h-[52px] rounded-[14px] bg-blue-500 text-white font-semibold text-[17px] ios-press flex items-center justify-center gap-2"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-5 w-5" strokeWidth={2.5} /> Copiado!
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar Link
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
