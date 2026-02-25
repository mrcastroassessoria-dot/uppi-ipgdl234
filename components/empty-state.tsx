'use client'

import { type LucideIcon, Car, MapPin, Heart, Bell, Trophy, CreditCard, MessageCircle, Star, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  preset?: 'rides' | 'offers' | 'favorites' | 'notifications' | 'achievements' | 'wallet' | 'messages' | 'reviews' | 'history'
}

const presets: Record<string, { icon: LucideIcon; title: string; description: string }> = {
  rides: {
    icon: Car,
    title: 'Nenhuma corrida ainda',
    description: 'Peca sua primeira corrida e negocie o melhor preco.',
  },
  offers: {
    icon: MapPin,
    title: 'Nenhuma oferta recebida',
    description: 'Aguarde, os motoristas estao analisando seu pedido.',
  },
  favorites: {
    icon: Heart,
    title: 'Nenhum favorito salvo',
    description: 'Salve seus destinos favoritos para acesso rapido.',
  },
  notifications: {
    icon: Bell,
    title: 'Tudo tranquilo por aqui',
    description: 'Voce nao tem notificacoes no momento.',
  },
  achievements: {
    icon: Trophy,
    title: 'Nenhuma conquista ainda',
    description: 'Complete corridas para desbloquear conquistas.',
  },
  wallet: {
    icon: CreditCard,
    title: 'Carteira vazia',
    description: 'Adicione creditos ou ative o cashback.',
  },
  messages: {
    icon: MessageCircle,
    title: 'Nenhuma mensagem',
    description: 'As mensagens das corridas aparecerao aqui.',
  },
  reviews: {
    icon: Star,
    title: 'Nenhuma avaliacao',
    description: 'Suas avaliacoes aparecerao aqui apos as corridas.',
  },
  history: {
    icon: Clock,
    title: 'Nenhuma corrida no historico',
    description: 'Seu historico de corridas aparecera aqui.',
  },
}

export function EmptyState({ icon, title, description, actionLabel, onAction, preset }: EmptyStateProps) {
  const config = preset ? presets[preset] : null
  const Icon = icon || config?.icon || MapPin
  const displayTitle = title || config?.title || 'Nada aqui'
  const displayDescription = description || config?.description || ''

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      {/* Icon circle */}
      <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-5">
        <Icon className="w-9 h-9 text-muted-foreground/50" strokeWidth={1.5} />
      </div>

      {/* Text */}
      <h3 className="text-[17px] font-bold text-foreground text-center mb-1.5">
        {displayTitle}
      </h3>
      <p className="text-[14px] text-muted-foreground/70 text-center max-w-[260px] leading-relaxed">
        {displayDescription}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-6 rounded-full px-6"
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
