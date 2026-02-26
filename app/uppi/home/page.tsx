'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { HomeSkeleton } from '@/components/ui/ios-skeleton'
import type { Profile } from '@/lib/types/database'
import { GoogleMap } from '@/components/google-map'
import type { GoogleMapHandle } from '@/components/google-map'
import { NearbyDrivers } from '@/components/nearby-drivers'
import { VoiceAssistantButton } from '@/components/voice-assistant-button'
import { LocationTag } from '@/components/ui/location-tag'
import { BottomNavigation } from '@/components/bottom-navigation'
import { generateSmartSuggestions, estimatePriceWithContext, generateContextualInsights, generatePriceAlert } from '@/lib/utils/ai-suggestions'
import type { DestinationSuggestion, PriceAlert } from '@/lib/utils/ai-suggestions'
import { MorphingSpinner } from '@/components/ui/morphing-spinner'
import { NotificationBanner } from '@/components/notification-banner'
import { CouponNotificationModal, useCouponNotification } from '@/components/coupon-notification-modal'
import { triggerHaptic } from '@/hooks/use-haptic'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { PermissionOnboarding } from '@/components/permission-onboarding'

interface FrequentRide {
  dropoff_address: string
  count: number
  pickup_address?: string
}

interface RecentPlace {
  name: string
  address: string
  icon: string
}

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [frequentRides, setFrequentRides] = useState<FrequentRide[]>([])
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<DestinationSuggestion[]>([])
  const [insights, setInsights] = useState<string[]>([])
  const [priceAlert, setPriceAlert] = useState<PriceAlert | null>(null)
  const [nearbyDriversCount, setNearbyDriversCount] = useState(0)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [showCouponBanner, setShowCouponBanner] = useState(false)
  const [showAchievementBanner, setShowAchievementBanner] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [favoriteAddresses, setFavoriteAddresses] = useState<string[]>([])
  const mapRef = useRef<GoogleMapHandle>(null)
  const router = useRouter()
  const supabase = createClient()
  const { notification: couponNotification, showNotification: showCouponModal, closeNotification: closeCouponModal } = useCouponNotification()

  const quickServices = [
    { label: 'Corrida', sub: 'Mais rapido', icon: 'car', color: 'from-[#1a1a2e] to-[#16213e]', href: '/uppi/ride/route-input' },
    { label: 'Entregas', sub: 'Envie pacotes', icon: 'box', color: 'from-[#e8751a] to-[#d4620f]', href: '/uppi/entregas' },
    { label: 'Intercidade', sub: 'Viaje longe', icon: 'globe', color: 'from-[#0d7377] to-[#14a3a8]', href: '/uppi/cidade-a-cidade' },
    { label: 'Agendar', sub: 'Para depois', icon: 'calendar', color: 'from-[#6c5ce7] to-[#5f3dc4]', href: '/uppi/ride/route-input' },
    { label: 'Bbzao', sub: 'Novidade', icon: 'zap', color: 'from-[#f7971e] to-[#ffd200]', href: '/uppi/bbzao' },
  ]

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    sessionStorage.setItem('userLocation', JSON.stringify({ lat, lng }))
    setUserLocation({ lat, lng })
  }, [])

  const handleCenterOnUser = useCallback(() => {
    mapRef.current?.centerOnUser()
  }, [])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Bom dia')
    else if (hour < 18) setGreeting('Boa tarde')
    else setGreeting('Boa noite')

    // Generate price alert for current time
    setPriceAlert(generatePriceAlert(hour, new Date().getDay()))

    // Load favorite addresses from localStorage
    const savedFavorites = localStorage.getItem('uppi_favorite_addresses')
    if (savedFavorites) {
      setFavoriteAddresses(JSON.parse(savedFavorites))
    }
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Load from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            setProfile(profileData)
            await loadFrequentRides(user.id)
          }
        } else {
          // Fallback: Load from local storage (no auth)
          const localProfile = sessionStorage.getItem('userProfile') || localStorage.getItem('uppi_profile')
          if (localProfile) {
            const localData = JSON.parse(localProfile)
            setProfile({
              id: 'local', full_name: localData.name, phone: localData.phone || '', user_type: localData.user_type || 'passenger',
              avatar_url: '/images/default-avatar.jpg', rating: 5.0, total_rides: 0,
              created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            })
            // Show welcome coupon for local users
            const hasSeenWelcome = sessionStorage.getItem('uppi_welcome_shown')
            if (!hasSeenWelcome) {
              sessionStorage.setItem('uppi_welcome_shown', 'true')
              setTimeout(() => {
                showCouponModal({
                  id: 'welcome',
                  userName: localData.name?.split(' ')[0] || 'Usuario',
                  title: 'Corrida gratis',
                  description: 'Na sua primeira corrida',
                  type: 'freeride',
                  icon: '🚗',
                })
              }, 1500)
            }
          } else {
            // Default guest profile
            setProfile({
              id: 'guest', full_name: 'Visitante', phone: '', user_type: 'passenger',
              avatar_url: '/images/default-avatar.jpg', rating: 5.0, total_rides: 0,
              created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            })
          }
        }
      } catch (error) {
        console.log('[v0] Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [supabase])

  const loadFrequentRides = async (userId: string) => {
    try {
      // Load frequent rides from database
      const { data: ridesData } = await supabase
        .from('rides')
        .select('dropoff_address, pickup_address')
        .eq('passenger_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (ridesData && ridesData.length > 0) {
        // Count frequency of destinations
        const addressCount: Record<string, { count: number; pickup?: string }> = {}
        ridesData.forEach(ride => {
          const addr = ride.dropoff_address
          if (addr) {
            addressCount[addr] = addressCount[addr] || { count: 0, pickup: ride.pickup_address }
            addressCount[addr].count++
          }
        })
        
        // Convert to array and sort by frequency
        const frequent = Object.entries(addressCount)
          .map(([address, data]) => ({
            dropoff_address: address,
            count: data.count,
            pickup_address: data.pickup,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
        
        setFrequentRides(frequent)
        
        // Generate AI suggestions based on frequent rides
        if (userLocation) {
          const suggestions = generateSmartSuggestions(frequent, userLocation)
          setAiSuggestions(suggestions)
          
          const contextInsights = generateContextualInsights(frequent, new Date().getHours())
          setInsights(contextInsights)
        }
      }
    } catch (error) {
      console.log('[v0] Error loading frequent rides:', error)
    }
  }

  const handleRefresh = useCallback(async () => {
    triggerHaptic('impact')
    // Temporary: Just trigger haptic, no data to reload
  }, [])

  if (loading) {
    return <HomeSkeleton />
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Amigo'

  const categoryFilters = [
    { label: 'Solicitar Corrida', icon: '🚗' },
    { label: 'Endereços Favoritos', icon: '⭐' },
    { label: 'Mais Pedidos', icon: '📍' },
    { label: 'Gasolina', icon: '⛽' },
  ]

  return (
    <main className="h-dvh flex flex-col relative overflow-hidden bg-background" aria-label="Tela principal do Uppi">
      {/* Map Area - Full Screen */}
      <div className="absolute inset-0" role="region" aria-label="Mapa de localizacao">
        <GoogleMap 
          ref={mapRef} 
          onLocationFound={handleLocationFound} 
          onMapReady={setMapInstance}
          className="w-full h-full" 
        />
        
        {/* Nearby Drivers Layer */}
        {userLocation && mapInstance && (
          <NearbyDrivers
            userLat={userLocation.lat}
            userLng={userLocation.lng}
            mapInstance={mapInstance}
            onDriversUpdate={setNearbyDriversCount}
          />
        )}

        {/* Top Search Bar - iOS Search Field Style */}
        <div className="absolute top-0 left-0 right-0 z-10 animate-ios-fade-up" style={{ animationDelay: '100ms' }}>
          <div 
            className="px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2"
            style={{
              background: 'linear-gradient(to bottom, rgba(242, 242, 247, 0.95) 0%, rgba(242, 242, 247, 0.8) 85%, transparent 100%)',
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            }}
          >
            <button
              type="button"
              aria-label="Buscar destino - Para onde voce quer ir?"
              role="search"
              className="w-full flex items-center gap-3 bg-white/90 dark:bg-[#1C1C1E]/90 ios-blur rounded-[14px] pl-4 pr-3.5 py-2.5 ios-press shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.3)]"
              onClick={() => { triggerHaptic('impact'); router.push('/uppi/ride/route-input') }}
            >
              <svg aria-hidden="true" className="w-[17px] h-[17px] text-[#8E8E93] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <span className="flex-1 text-[#8E8E93] dark:text-[#8E8E93] text-[17px] text-left font-normal tracking-[-0.4px]">{'Pesquise aqui'}</span>
              <div onClick={(e) => e.stopPropagation()}>
                <LocationTag />
              </div>
            </button>
            
            {/* Category Filters */}
            <div className="flex gap-2 mt-3 overflow-x-auto ios-scroll pb-1 -mx-1 px-1">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  className={`flex-shrink-0 flex items-center gap-2 ios-blur rounded-full px-4 py-2 ios-press shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.3)] transition-all ${
                    selectedCategory === cat.label 
                      ? 'bg-[#007AFF] text-white' 
                      : 'bg-white/80 dark:bg-[#1C1C1E]/80'
                  }`}
                  onClick={() => {
                    triggerHaptic('selection')
                    setSelectedCategory(selectedCategory === cat.label ? null : cat.label)
                  }}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className={`text-[15px] font-medium tracking-[-0.2px] whitespace-nowrap ${
                    selectedCategory === cat.label ? 'text-white' : 'text-foreground'
                  }`}>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Favorites/Recent Addresses Dropdown */}
            {selectedCategory && (
              <div className="mt-3 ios-blur-heavy bg-white/95 dark:bg-[#1C1C1E]/95 rounded-[14px] p-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_4px_24px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 max-h-[300px] overflow-y-auto ios-scroll">
                {selectedCategory === 'Endereços Favoritos' && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[17px] font-semibold text-foreground tracking-[-0.4px]">Endereços Salvos</h3>
                      {favoriteAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem('uppi_favorite_addresses')
                            setFavoriteAddresses([])
                            triggerHaptic('impact')
                          }}
                          className="text-[13px] text-[#FF3B30] font-medium ios-press"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    {favoriteAddresses.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📍</div>
                        <p className="text-[15px] text-[#8E8E93] tracking-[-0.2px]">
                          Nenhum endereço salvo ainda
                        </p>
                        <p className="text-[13px] text-[#8E8E93] mt-1">
                          Seus endereços pesquisados aparecerão aqui
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {favoriteAddresses.map((address, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full flex items-start gap-3 p-3 rounded-[12px] bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 ios-press text-left"
                            onClick={() => {
                              triggerHaptic('selection')
                              sessionStorage.setItem('selectedDestination', address)
                              router.push('/uppi/ride/route-input')
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-[#007AFF]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-medium text-foreground tracking-[-0.2px] truncate">
                                {address}
                              </p>
                              <p className="text-[13px] text-[#8E8E93] mt-0.5">
                                Toque para ir
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {selectedCategory === 'Mais Pedidos' && frequentRides.length > 0 && (
                  <>
                    <h3 className="text-[17px] font-semibold text-foreground tracking-[-0.4px] mb-3">Destinos Frequentes</h3>
                    <div className="space-y-2">
                      {frequentRides.map((ride, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full flex items-start gap-3 p-3 rounded-[12px] bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50 ios-press text-left"
                          onClick={() => {
                            triggerHaptic('selection')
                            sessionStorage.setItem('selectedDestination', ride.dropoff_address)
                            router.push('/uppi/ride/route-input')
                          }}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#34C759]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[15px]">📍</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-medium text-foreground tracking-[-0.2px] truncate">
                              {ride.dropoff_address}
                            </p>
                            <p className="text-[13px] text-[#8E8E93] mt-0.5">
                              {ride.count} {ride.count === 1 ? 'vez' : 'vezes'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {selectedCategory === 'Solicitar Corrida' && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🚗</div>
                    <p className="text-[15px] font-medium text-foreground tracking-[-0.2px] mb-2">
                      Solicitar uma corrida
                    </p>
                    <p className="text-[13px] text-[#8E8E93] mb-4">
                      Informe seu destino para começar
                    </p>
                    <button
                      type="button"
                      className="bg-[#007AFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold ios-press"
                      onClick={() => {
                        triggerHaptic('impact')
                        router.push('/uppi/ride/route-input')
                      }}
                    >
                      Onde você vai?
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-0 right-0 z-10 px-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left side - Info pill */}
            <div className="flex gap-2">
              {nearbyDriversCount > 0 && (
                <div className="ios-blur-heavy bg-white/90 dark:bg-black/75 rounded-full px-4 py-2.5 flex items-center gap-2 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_2px_16px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10">
                  <div className="w-[6px] h-[6px] bg-[#34C759] rounded-full animate-pulse shadow-[0_0_4px_rgba(52,199,89,0.6)]" />
                  <span className="text-[13px] font-semibold text-foreground tracking-[-0.2px]">
                    {nearbyDriversCount} motorista{nearbyDriversCount !== 1 ? 's' : ''} próximo{nearbyDriversCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
              {/* GPS button - iOS circle button */}
              <button
                type="button"
                aria-label="Centralizar no mapa na minha localizacao"
                className="w-[52px] h-[52px] ios-blur-heavy bg-white/90 dark:bg-black/75 rounded-full flex items-center justify-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_2px_16px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 ios-press"
                onClick={handleCenterOnUser}
              >
                <svg className="w-5 h-5 text-[#007AFF]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </button>
              
              {/* Voice Assistant button */}
              <VoiceAssistantButton />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom)]">
        <BottomNavigation />
      </div>

      {/* iFood-style Coupon/Reward Modal */}
      <CouponNotificationModal
        notification={couponNotification}
        onClose={closeCouponModal}
        onAccept={() => {
          closeCouponModal()
          router.push('/uppi/wallet')
        }}
      />
      
      <PermissionOnboarding />
    </main>
  )
}
