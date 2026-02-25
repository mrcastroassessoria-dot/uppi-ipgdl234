'use client'

import { useState, useEffect } from 'react'
import { MapPin, Bell, X } from 'lucide-react'
import { iosToast } from '@/lib/utils/ios-toast'
import { triggerHaptic } from '@/hooks/use-haptic'

export function PermissionOnboarding() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState<'location' | 'notification' | 'complete'>('location')
  const [locationGranted, setLocationGranted] = useState(false)
  const [notificationGranted, setNotificationGranted] = useState(false)

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    // Check if already onboarded
    const onboarded = localStorage.getItem('permissions_onboarded')
    if (onboarded === 'true') return

    // Check current permissions
    try {
      const locationStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      const notificationStatus = 'Notification' in window ? Notification.permission : 'denied'

      if (locationStatus.state === 'granted' && notificationStatus === 'granted') {
        localStorage.setItem('permissions_onboarded', 'true')
        return
      }

      // Show onboarding after 2 seconds on first visit
      setTimeout(() => {
        if (locationStatus.state !== 'granted') {
          setShow(true)
          setStep('location')
        } else if (notificationStatus !== 'granted') {
          setLocationGranted(true)
          setShow(true)
          setStep('notification')
        }
      }, 2000)
    } catch (error) {
      console.error('[v0] Permission check error:', error)
    }
  }

  const requestLocation = async () => {
    triggerHaptic('impact')
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })

      if (position) {
        setLocationGranted(true)
        iosToast.success('Localizacao permitida')
        triggerHaptic('success')
        
        // Move to notification step
        setTimeout(() => {
          if ('Notification' in window && Notification.permission !== 'granted') {
            setStep('notification')
          } else {
            finishOnboarding()
          }
        }, 800)
      }
    } catch (error) {
      iosToast.error('Permissao de localizacao necessaria')
      triggerHaptic('error')
    }
  }

  const requestNotification = async () => {
    triggerHaptic('impact')
    if (!('Notification' in window)) {
      iosToast.error('Notificacoes nao suportadas')
      finishOnboarding()
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationGranted(true)
        iosToast.success('Notificacoes permitidas')
        triggerHaptic('success')
        setTimeout(() => finishOnboarding(), 800)
      } else {
        iosToast.error('Notificacoes negadas')
        finishOnboarding()
      }
    } catch (error) {
      console.error('[v0] Notification permission error:', error)
      finishOnboarding()
    }
  }

  const finishOnboarding = () => {
    setStep('complete')
    localStorage.setItem('permissions_onboarded', 'true')
    setTimeout(() => setShow(false), 1500)
  }

  const skip = () => {
    triggerHaptic('selection')
    localStorage.setItem('permissions_onboarded', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md mx-4 mb-8 bg-white/95 dark:bg-[#1C1C1E]/95 ios-blur-heavy rounded-[32px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.2),0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_8px_40px_rgba(0,0,0,0.6),0_20px_80px_rgba(0,0,0,0.8)] border border-black/[0.04] dark:border-white/[0.08] animate-in slide-in-from-bottom duration-300">
        {/* Close button */}
        <button
          onClick={skip}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/[0.06] dark:bg-white/[0.1] flex items-center justify-center ios-press"
        >
          <X className="w-4 h-4 text-foreground" strokeWidth={2.5} />
        </button>

        <div className="p-8">
          {step === 'location' && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#007AFF]/10 flex items-center justify-center mx-auto mb-5">
                <MapPin className="w-10 h-10 text-[#007AFF]" strokeWidth={2} />
              </div>
              <h2 className="text-[28px] font-bold text-center mb-2.5 tracking-[-0.6px]">Ative sua localização</h2>
              <p className="text-[15px] text-[#8E8E93] text-center mb-8 leading-relaxed">
                Precisamos da sua localização para encontrar motoristas próximos e calcular rotas precisas.
              </p>
              <button
                onClick={requestLocation}
                className="w-full h-[54px] bg-[#007AFF] text-white rounded-[16px] font-semibold text-[17px] tracking-[-0.4px] ios-press mb-2.5 shadow-[0_2px_8px_rgba(0,122,255,0.3)]"
              >
                Permitir Localização
              </button>
              <button
                onClick={skip}
                className="w-full h-[54px] bg-black/[0.05] dark:bg-white/[0.08] text-[#007AFF] rounded-[16px] font-semibold text-[17px] tracking-[-0.4px] ios-press"
              >
                Agora não
              </button>
            </>
          )}

          {step === 'notification' && (
            <>
              <div className="w-20 h-20 rounded-full bg-[#FF9500]/10 flex items-center justify-center mx-auto mb-5">
                <Bell className="w-10 h-10 text-[#FF9500]" strokeWidth={2} />
              </div>
              <h2 className="text-[28px] font-bold text-center mb-2.5 tracking-[-0.6px]">Ative as notificações</h2>
              <p className="text-[15px] text-[#8E8E93] text-center mb-8 leading-relaxed">
                Receba atualizações em tempo real sobre suas corridas, motoristas e ofertas especiais.
              </p>
              <button
                onClick={requestNotification}
                className="w-full h-[54px] bg-[#FF9500] text-white rounded-[16px] font-semibold text-[17px] tracking-[-0.4px] ios-press mb-2.5 shadow-[0_2px_8px_rgba(255,149,0,0.3)]"
              >
                Permitir Notificações
              </button>
              <button
                onClick={skip}
                className="w-full h-[54px] bg-black/[0.05] dark:bg-white/[0.08] text-[#FF9500] rounded-[16px] font-semibold text-[17px] tracking-[-0.4px] ios-press"
              >
                Agora não
              </button>
            </>
          )}

          {step === 'complete' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full bg-[#34C759]/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[28px] font-bold mb-2.5 tracking-[-0.6px]">Tudo pronto!</h2>
              <p className="text-[15px] text-[#8E8E93] leading-relaxed">
                Você está pronto para usar o Uppi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
