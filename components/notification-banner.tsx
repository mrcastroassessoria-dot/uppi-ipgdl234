'use client'

import { X, TrendingUp, Gift, AlertCircle, Star, Zap, Trophy, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export type BannerType = 
  | 'surge_pricing' 
  | 'coupon' 
  | 'achievement' 
  | 'cashback' 
  | 'info' 
  | 'warning'
  | 'hot_zone'
  | 'free_ride'

interface NotificationBannerProps {
  type: BannerType
  title: string
  description: string
  subtitle?: string
  icon?: React.ReactNode
  onDismiss?: () => void
  onClick?: () => void
  dismissible?: boolean
  className?: string
}

const bannerConfig = {
  surge_pricing: {
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-gradient-to-r from-amber-500 to-orange-600',
    icon: TrendingUp,
    iconBg: 'bg-white/20'
  },
  coupon: {
    gradient: 'from-purple-500 to-pink-600',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-600',
    icon: Gift,
    iconBg: 'bg-white/20'
  },
  achievement: {
    gradient: 'from-yellow-500 to-amber-600',
    bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
    icon: Trophy,
    iconBg: 'bg-white/20'
  },
  cashback: {
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
    icon: Star,
    iconBg: 'bg-white/20'
  },
  hot_zone: {
    gradient: 'from-red-500 to-rose-600',
    bgColor: 'bg-gradient-to-r from-red-500 to-rose-600',
    icon: Zap,
    iconBg: 'bg-white/20'
  },
  free_ride: {
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    icon: Gift,
    iconBg: 'bg-white/20'
  },
  info: {
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
    icon: Info,
    iconBg: 'bg-white/20'
  },
  warning: {
    gradient: 'from-amber-600 to-orange-700',
    bgColor: 'bg-gradient-to-r from-amber-600 to-orange-700',
    icon: AlertCircle,
    iconBg: 'bg-white/20'
  }
}

export function NotificationBanner({
  type,
  title,
  description,
  subtitle,
  icon,
  onDismiss,
  onClick,
  dismissible = true,
  className
}: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const config = bannerConfig[type]
  const IconComponent = icon || config.icon

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'relative overflow-hidden rounded-xl xs:rounded-2xl',
          config.bgColor,
          'shadow-lg',
          onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
          className
        )}
        onClick={onClick}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-32 h-32 xs:w-40 xs:h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 xs:w-40 xs:h-40 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative p-3 xs:p-4 flex items-center gap-2.5 xs:gap-4">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 w-10 h-10 xs:w-12 xs:h-12 rounded-lg xs:rounded-xl flex items-center justify-center',
            config.iconBg
          )}>
            <IconComponent className="w-5 h-5 xs:w-6 xs:h-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm xs:text-base leading-tight mb-0.5">
              {title}
            </h3>
            <p className="text-white/90 text-xs xs:text-sm leading-snug">
              {description}
            </p>
            {subtitle && (
              <p className="text-white/70 text-[11px] xs:text-xs mt-0.5 xs:mt-1 italic">
                {subtitle}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-7 h-7 xs:w-8 xs:h-8 rounded-full bg-white/20 hover:bg-white/30 
                       flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-white" />
            </button>
          )}

          {/* Click indicator */}
          {onClick && !dismissible && (
            <div className="flex-shrink-0 text-white/60">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Shine effect on tap/click */}
        {onClick && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            whileTap={{ opacity: 0.1 }}
            transition={{ duration: 0.1 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// Preset banners for common scenarios
export function SurgePricingBanner({ onDismiss, onClick }: { onDismiss?: () => void; onClick?: () => void }) {
  return (
    <NotificationBanner
      type="surge_pricing"
      title="Horário de pico"
      description="Preços ~15% acima do normal agora"
      subtitle="Ofereça um valor mais baixo - motoristas costumam aceitar negociação"
      onDismiss={onDismiss}
      onClick={onClick}
    />
  )
}

export function CouponBanner({ 
  couponValue, 
  onDismiss, 
  onClick 
}: { 
  couponValue: string
  onDismiss?: () => void
  onClick?: () => void 
}) {
  return (
    <NotificationBanner
      type="coupon"
      title="Você ganhou um cupom!"
      description={`${couponValue} de desconto na próxima corrida`}
      onDismiss={onDismiss}
      onClick={onClick}
    />
  )
}

export function HotZoneBanner({ 
  zone, 
  multiplier,
  onDismiss, 
  onClick 
}: { 
  zone: string
  multiplier: string
  onDismiss?: () => void
  onClick?: () => void 
}) {
  return (
    <NotificationBanner
      type="hot_zone"
      title="Zona quente próxima!"
      description={`${zone} - Ganhos ${multiplier}x maiores`}
      subtitle="Desloque-se para esta área e ganhe mais"
      onDismiss={onDismiss}
      onClick={onClick}
    />
  )
}

export function FreeeRideBanner({ onDismiss, onClick }: { onDismiss?: () => void; onClick?: () => void }) {
  return (
    <NotificationBanner
      type="free_ride"
      title="Corrida grátis disponível!"
      description="Use agora seu crédito de R$ 20,00"
      subtitle="Válido até hoje às 23:59"
      onDismiss={onDismiss}
      onClick={onClick}
    />
  )
}

export function AchievementBanner({ 
  achievement, 
  onDismiss, 
  onClick 
}: { 
  achievement: string
  onDismiss?: () => void
  onClick?: () => void 
}) {
  return (
    <NotificationBanner
      type="achievement"
      title="Nova conquista desbloqueada!"
      description={achievement}
      onDismiss={onDismiss}
      onClick={onClick}
    />
  )
}

export function CashbackBanner({ 
  amount, 
  onDismiss, 
  onClick 
}: { 
  amount: string
  onDismiss?: () => void
  onClick?: () => void 
}) {
  return (
    <NotificationBanner
      type="cashback"
      title="Cashback recebido!"
      description={`+${amount} adicionados à sua carteira`}
      onDismiss={onDismiss}
      onClick={onClick}
    />
  )
}
