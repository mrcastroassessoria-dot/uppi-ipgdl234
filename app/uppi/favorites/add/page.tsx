'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { geolocationService } from '@/lib/services/geolocation-service'
import { iosToast } from '@/lib/utils/ios-toast'
import { haptics } from '@/lib/utils/ios-haptics'
import { favoriteLocationSchema, validateForm } from '@/lib/validations/schemas'
import { ArrowLeft, Home, Briefcase, MapPin, Check } from 'lucide-react'

export default function AddFavoritePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [locationName, setLocationName] = useState('')
  const [address, setAddress] = useState('')
  const [locationType, setLocationType] = useState<'home' | 'work' | 'other'>('home')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateForm(favoriteLocationSchema, { 
      location_name: locationName, 
      address, 
      location_type: locationType 
    })
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]
      haptics.notificationError()
      iosToast.error(firstError || 'Preencha os campos')
      return
    }

    setLoading(true)
    haptics.impactMedium()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/onboarding/splash')
        return
      }

      // Geocode the address to get real coordinates
      let latitude = -23.5505 // Fallback São Paulo
      let longitude = -46.6333
      
      try {
        const coords = await geolocationService.geocodeAddress(address)
        if (coords) {
          latitude = coords.lat
          longitude = coords.lng
          console.log('[v0] Geocoded address:', address, coords)
        }
      } catch (geocodeError) {
        console.error('[v0] Geocoding failed, using fallback:', geocodeError)
      }

      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          location_name: locationName,
          address: address,
          latitude,
          longitude,
          location_type: locationType
        })

      if (error) throw error

      haptics.notificationSuccess()
      iosToast.success('Favorito salvo com sucesso!')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/uppi/favorites')
    } catch (error) {
      console.error('[v0] Error adding favorite:', error)
      haptics.notificationError()
      iosToast.error('Erro ao adicionar favorito')
    } finally {
      setLoading(false)
    }
  }

  const locationOptions = [
    {
      value: 'home' as const,
      icon: Home,
      label: 'Casa',
      description: 'Seu endereço residencial',
      color: 'blue'
    },
    {
      value: 'work' as const,
      icon: Briefcase,
      label: 'Trabalho',
      description: 'Seu local de trabalho',
      color: 'purple'
    },
    {
      value: 'other' as const,
      icon: MapPin,
      label: 'Outro',
      description: 'Qualquer outro local',
      color: 'green'
    }
  ]

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex flex-col">
      {/* iOS Status Bar Spacer */}
      <div className="h-[env(safe-area-inset-top)]" />
      
      {/* Navigation Bar */}
      <header className="relative z-10 px-4 py-3 flex items-center backdrop-blur-xl bg-white/50 dark:bg-black/50 border-b border-black/[0.04] dark:border-white/[0.08]">
        <button 
          onClick={() => {
            haptics.selection()
            router.back()
          }}
          className="inline-flex items-center gap-2 text-[#007AFF] text-[17px] font-normal ios-press group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
          Voltar
        </button>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-[32px] font-bold text-foreground mb-2 tracking-[-0.8px]">
            Adicionar Favorito
          </h1>
          <p className="text-[15px] text-[#8E8E93] mb-8">
            Salve seus locais mais visitados para acesso rápido
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Type Cards */}
            <div>
              <label className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3 block">
                Tipo de Local
              </label>
              <div className="space-y-3">
                {locationOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = locationType === option.value
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        haptics.selection()
                        setLocationType(option.value)
                      }}
                      className={`
                        w-full group relative overflow-hidden
                        bg-white/80 dark:bg-white/[0.03]
                        backdrop-blur-xl
                        border transition-all duration-200
                        ${isSelected 
                          ? 'ring-2 ring-[#007AFF] border-[#007AFF]/50' 
                          : 'border-black/[0.08] dark:border-white/[0.08] hover:border-[#007AFF]/30'
                        }
                        rounded-[16px] p-4
                        ios-press
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                          ${option.color === 'blue' ? 'bg-[#007AFF]/10' : ''}
                          ${option.color === 'purple' ? 'bg-[#AF52DE]/10' : ''}
                          ${option.color === 'green' ? 'bg-[#34C759]/10' : ''}
                        `}>
                          <Icon className={`
                            w-6 h-6
                            ${option.color === 'blue' ? 'text-[#007AFF]' : ''}
                            ${option.color === 'purple' ? 'text-[#AF52DE]' : ''}
                            ${option.color === 'green' ? 'text-[#34C759]' : ''}
                          `} strokeWidth={2} />
                        </div>
                        
                        <div className="flex-1 text-left">
                          <h3 className="text-[17px] font-semibold text-foreground">
                            {option.label}
                          </h3>
                          <p className="text-[13px] text-[#8E8E93]">
                            {option.description}
                          </p>
                        </div>

                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                          transition-all duration-200
                          ${isSelected 
                            ? 'border-[#007AFF] bg-[#007AFF]' 
                            : 'border-[#8E8E93]/30'
                          }
                        `}>
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3 block">
                  Nome do Local
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder={
                    locationType === 'home' ? 'Ex: Minha Casa' :
                    locationType === 'work' ? 'Ex: Escritório' :
                    'Ex: Academia, Mercado...'
                  }
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                  className="
                    w-full h-[52px] px-4
                    bg-white/80 dark:bg-white/[0.03]
                    backdrop-blur-xl
                    border border-black/[0.08] dark:border-white/[0.08]
                    rounded-[12px]
                    text-[17px] text-foreground
                    placeholder:text-[#8E8E93]
                    focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent
                    transition-all duration-200
                  "
                />
              </div>

              <div>
                <label htmlFor="address" className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3 block">
                  Endereço Completo
                </label>
                <input
                  id="address"
                  type="text"
                  placeholder="Rua, número, bairro, cidade..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="
                    w-full h-[52px] px-4
                    bg-white/80 dark:bg-white/[0.03]
                    backdrop-blur-xl
                    border border-black/[0.08] dark:border-white/[0.08]
                    rounded-[12px]
                    text-[17px] text-foreground
                    placeholder:text-[#8E8E93]
                    focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent
                    transition-all duration-200
                  "
                />
                <p className="text-[13px] text-[#8E8E93] mt-2">
                  Digite o endereço completo para melhores resultados
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !locationName || !address}
              className="
                w-full h-[56px]
                bg-[#007AFF] hover:bg-[#0051D5]
                disabled:bg-[#8E8E93]/30 disabled:cursor-not-allowed
                text-white text-[17px] font-semibold
                rounded-[14px]
                transition-all duration-200
                ios-press
                shadow-lg shadow-[#007AFF]/20
              "
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : (
                'Salvar Favorito'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Bottom Safe Area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
