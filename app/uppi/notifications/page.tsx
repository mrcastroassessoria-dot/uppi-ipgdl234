'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/bottom-navigation'
import { EmptyState } from '@/components/empty-state'
import { iosToast } from '@/lib/utils/ios-toast'
import { haptics } from '@/lib/utils/ios-haptics'
import NotificationsSkeleton from '@/components/notifications-skeleton'
import { IOSSegmentedControl } from '@/components/ui/ios-segmented-control'
import { IOSBadge } from '@/components/ui/ios-badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Car, DollarSign, Gift, Megaphone, CheckCheck } from 'lucide-react'
import { notificationService } from '@/lib/services/notification-service'

interface Notification {
  id: string
  title: string
  message: string
  type: 'ride' | 'offer' | 'payment' | 'system'
  is_read: boolean
  created_at: string
  ride_id?: string
}

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
    
    // Subscribe to real-time notifications
    const { data: { user } } = supabase.auth.getUser().then((res) => {
      if (res.data.user) {
        const unsubscribe = notificationService.subscribeToNotifications(
          res.data.user.id,
          (newNotification) => {
            setNotifications((prev) => [newNotification, ...prev])
            haptics.notification('success')
            iosToast.info(newNotification.title, newNotification.body)
          }
        )
        return () => unsubscribe()
      }
    })
  }, [])

  const loadNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/welcome')
        return
      }

      const result = await notificationService.getUserNotifications(user.id)
      if (result.success && result.notifications) {
        setNotifications(result.notifications)
      }
    } catch (error) {
      console.error('[v0] Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    const result = await notificationService.markAsRead(notificationId)
    if (result.success) {
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
    }
  }

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('[v0] Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return <Car className="w-5 h-5" strokeWidth={2.5} />
      case 'offer':
        return <DollarSign className="w-5 h-5" strokeWidth={2.5} />
      case 'payment':
        return <DollarSign className="w-5 h-5" strokeWidth={2.5} />
      case 'promotion':
        return <Gift className="w-5 h-5" strokeWidth={2.5} />
      case 'system':
        return <Megaphone className="w-5 h-5" strokeWidth={2.5} />
      default:
        return <Bell className="w-5 h-5" strokeWidth={2.5} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ride':
        return 'bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF]'
      case 'offer':
        return 'bg-[#34C759]/10 dark:bg-[#34C759]/20 text-[#34C759]'
      case 'payment':
        return 'bg-[#AF52DE]/10 dark:bg-[#AF52DE]/20 text-[#AF52DE]'
      case 'promotion':
        return 'bg-[#FF9500]/10 dark:bg-[#FF9500]/20 text-[#FF9500]'
      case 'system':
        return 'bg-gray-500/10 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'
      default:
        return 'bg-[#007AFF]/10 dark:bg-[#007AFF]/20 text-[#007AFF]'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return <NotificationsSkeleton />
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n) => !n.is_read)
    : notifications

  return (
    <div className="h-dvh overflow-y-auto bg-gradient-to-b from-[#F2F2F7] via-[#FAFAFA] to-white dark:from-black dark:via-[#0A0A0A] dark:to-[#111111] pb-28 ios-scroll">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow-delayed" />
      </div>

      {/* Header with blur */}
      <header className="relative z-10 bg-white/80 dark:bg-black/80 ios-blur-heavy border-b border-black/[0.08] dark:border-white/[0.08] sticky top-0">
        <div className="px-5 pt-safe-offset-4 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              type="button" 
              onClick={() => {
                haptics.impactLight()
                router.back()
              }} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/60 ios-press"
            >
              <svg className="w-[20px] h-[20px] text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold text-foreground tracking-tight">Notificações</h1>
                {unreadCount > 0 && (
                  <IOSBadge variant="error" size="sm">
                    {unreadCount}
                  </IOSBadge>
                )}
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {unreadCount > 0 
                  ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                  : 'Todas as notificações lidas'
                }
              </p>
            </div>
            {unreadCount > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  haptics.impactMedium()
                  markAllAsRead()
                  iosToast.success('Todas marcadas como lidas')
                }} 
                className="flex items-center gap-2 px-4 h-10 bg-blue-500 text-white rounded-full text-[15px] font-semibold ios-press shadow-lg"
              >
                <CheckCheck className="w-4 h-4" strokeWidth={2.5} />
                Ler tudo
              </button>
            )}
          </div>

          {/* Filter Segmented Control */}
          <IOSSegmentedControl
            value={filter}
            onValueChange={(value) => {
              haptics.selection()
              setFilter(value as 'all' | 'unread')
            }}
            options={[
              { label: `Todas (${notifications.length})`, value: 'all' },
              { label: `Não lidas (${unreadCount})`, value: 'unread' }
            ]}
          />
        </div>
      </header>

      <main className="relative z-10 px-5 py-6 max-w-2xl mx-auto">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <EmptyState preset="notifications" />
          </motion.div>
        ) : (
          <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[24px] overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-lg">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, i) => (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  type="button"
                  className={`w-full px-5 py-5 flex gap-4 text-left ios-press relative overflow-hidden ${
                    i < filteredNotifications.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : ''
                  }`}
                  onClick={() => {
                    haptics.impactLight()
                    if (!notification.is_read) markAsRead(notification.id)
                    if (notification.ride_id) {
                      router.push(`/uppi/ride/${notification.ride_id}/tracking`)
                    }
                  }}
                >
                  {/* Unread indicator background */}
                  {!notification.is_read && (
                    <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10" />
                  )}

                  {/* Icon */}
                  <div className={`relative w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 ${
                    notification.is_read 
                      ? 'bg-secondary/60' 
                      : getNotificationColor(notification.type)
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="relative flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className={`text-[15px] font-semibold leading-snug ${
                        notification.is_read ? 'text-foreground/70' : 'text-foreground'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className="text-[12px] text-muted-foreground/60 whitespace-nowrap flex-shrink-0 mt-0.5">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className={`text-[13px] leading-relaxed line-clamp-2 ${
                      notification.is_read ? 'text-muted-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {/* Type badge */}
                    <div className="mt-2">
                      <IOSBadge 
                        variant={
                          notification.type === 'ride' ? 'info' :
                          notification.type === 'offer' ? 'success' :
                          notification.type === 'payment' ? 'warning' :
                          'default'
                        }
                        size="sm"
                      >
                        {notification.type === 'ride' ? 'Corrida' :
                         notification.type === 'offer' ? 'Oferta' :
                         notification.type === 'payment' ? 'Pagamento' :
                         notification.type === 'promotion' ? 'Promoção' :
                         'Sistema'}
                      </IOSBadge>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notification.is_read && (
                    <div className="relative w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 shadow-lg shadow-blue-500/50" />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
