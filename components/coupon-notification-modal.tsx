'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Gift, Ticket, Car, Coins } from 'lucide-react'

interface CouponNotification {
  id: string
  userName: string
  title: string
  description: string
  icon?: string
  type: 'coupon' | 'cashback' | 'freeride' | 'discount'
}

interface CouponNotificationModalProps {
  notification: CouponNotification | null
  onClose: () => void
  onAccept: () => void
}

const typeConfig = {
  coupon: { color: 'from-purple-500 to-pink-500', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', Icon: Ticket, emoji: '🎟️' },
  cashback: { color: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', Icon: Coins, emoji: '💰' },
  freeride: { color: 'from-blue-500 to-indigo-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', Icon: Car, emoji: '🚗' },
  discount: { color: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', Icon: Gift, emoji: '🎁' },
}

export function CouponNotificationModal({
  notification,
  onClose,
  onAccept,
}: CouponNotificationModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (notification) {
      setShow(true)
    }
  }, [notification])

  if (!notification) return null

  const config = typeConfig[notification.type] || typeConfig.coupon

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  const handleAccept = () => {
    setShow(false)
    setTimeout(onAccept, 300)
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] max-w-sm mx-auto"
          >
            <div className="relative bg-gradient-to-b from-purple-50 via-pink-50/50 to-white dark:from-purple-950/80 dark:via-pink-950/40 dark:to-[#1C1C1E] rounded-[32px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.2),0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_8px_40px_rgba(0,0,0,0.6),0_20px_80px_rgba(0,0,0,0.8)] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
              
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-foreground/70 ios-press"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>

              {/* Club Uppi Badge */}
              <div className="relative pt-5 pb-2 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-card rounded-full shadow-md border border-purple-100 dark:border-purple-800/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wide">Club Uppi</span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                </motion.div>
              </div>

              {/* Floating Decorations */}
              <div className="relative h-24 overflow-visible">
                {/* Left decoration */}
                <motion.div
                  initial={{ x: -80, opacity: 0, rotate: -30 }}
                  animate={{ x: 0, opacity: 1, rotate: -8 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 200 }}
                  className="absolute left-4 top-0"
                >
                  <div className="relative">
                    <div className="w-14 h-14 bg-pink-200 dark:bg-pink-800/40 rounded-2xl flex items-center justify-center rotate-[-8deg]">
                      <Gift className="w-7 h-7 text-pink-500" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Right decoration */}
                <motion.div
                  initial={{ x: 80, opacity: 0, rotate: 30 }}
                  animate={{ x: 0, opacity: 1, rotate: 8 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="absolute right-4 top-0"
                >
                  <div className="relative">
                    <div className="w-14 h-14 bg-purple-200 dark:bg-purple-800/40 rounded-2xl flex items-center justify-center rotate-[8deg]">
                      <span className="text-2xl">{notification.icon || config.emoji}</span>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                      className="absolute -bottom-1 -left-2"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400 fill-purple-400" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Center floating sparkles */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute left-1/2 -translate-x-1/2 top-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 1 }}
                  className="absolute left-[35%] top-8"
                >
                  <Sparkles className="w-3 h-3 text-pink-300" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute right-[35%] top-6"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                </motion.div>
              </div>

              {/* User greeting + "voce ganhou:" */}
              <div className="text-center px-6 -mt-2">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-[20px] font-bold text-pink-500 dark:text-pink-400 tracking-[-0.4px]"
                >
                  {notification.userName},
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[24px] font-bold text-foreground mt-1 tracking-[-0.6px]"
                >
                  {'voce ganhou:'}
                </motion.p>
              </div>

              {/* Reward Card */}
              <div className="px-5 pt-4 pb-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                  className="bg-white dark:bg-card rounded-2xl p-4 shadow-lg border border-border/40"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon */}
                    <div className={`w-14 h-14 ${config.iconBg} dark:bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {notification.icon ? (
                        <span className="text-2xl">{notification.icon}</span>
                      ) : (
                        <config.Icon className={`w-7 h-7 ${config.iconColor}`} />
                      )}
                    </div>
                    {/* Separator */}
                    <div className="w-px h-10 bg-border/60" />
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground leading-tight">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleAccept}
                  className={`w-full mt-4 h-[54px] bg-gradient-to-r ${config.color} text-white text-[17px] font-bold rounded-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.15)] ios-press tracking-[-0.4px]`}
                >
                  Quero Usar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook to manage coupon notifications
export function useCouponNotification() {
  const [notification, setNotification] = useState<CouponNotification | null>(null)

  const showNotification = (notif: CouponNotification) => {
    setNotification(notif)
  }

  const closeNotification = () => {
    setNotification(null)
  }

  return {
    notification,
    showNotification,
    closeNotification,
  }
}
