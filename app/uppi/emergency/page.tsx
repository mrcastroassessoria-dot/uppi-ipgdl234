'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EmergencyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [countdown, setCountdown] = useState<number | null>(null)
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [sharingLocation, setSharingLocation] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [audioRecording, setAudioRecording] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null)

  useEffect(() => {
    loadEmergencyContacts()
  }, [])

  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          activateEmergency()
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [countdown])

  const loadEmergencyContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('emergency_contacts')
        .eq('id', user.id)
        .single()
      setEmergencyContacts(profile?.emergency_contacts || [])
    } catch (error) {
      console.error('Error loading emergency contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const startCountdown = () => setCountdown(5)
  const cancelCountdown = () => {
    setCountdown(null)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  const activateEmergency = async () => {
    setActivating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      await supabase.from('emergency_alerts').insert({
        user_id: user.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        status: 'active',
      })

      // Generate share link
      const link = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
      setShareLink(link)

      iosToast.success('Alerta ativado! Contatos notificados')
    } catch (error) {
      console.error('Error activating emergency:', error)
      iosToast.error('Erro ao ativar emergencia')
    } finally {
      setActivating(false)
    }
  }

  const handleShareLocation = async () => {
    setSharingLocation(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      })
      const link = `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
      setShareLink(link)

      if (navigator.share) {
        await navigator.share({
          title: 'Minha localizacao - Uppi',
          text: 'Estou compartilhando minha localizacao em tempo real',
          url: link,
        })
      } else {
        await navigator.clipboard.writeText(link)
        iosToast.success('Link copiado')
      }
    } catch (error) {
      console.error('Error sharing location:', error)
    } finally {
      setSharingLocation(false)
    }
  }

  const toggleAudioRecording = () => {
    setAudioRecording(!audioRecording)
    // In production, this would use MediaRecorder API
  }

  const countdownProgress = countdown !== null ? countdown / 5 : 1
  const circumference = 2 * Math.PI * 56

  if (loading) {
    return (
      <div className="h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-[2.5px] border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-dvh overflow-y-auto bg-background ios-scroll">
      {/* Header */}
      <header className="bg-card/95 ios-blur border-b border-border sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full ios-press">
              <svg className="w-[22px] h-[22px] text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[20px] font-bold text-red-500 tracking-tight">Emergencia</h1>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto flex flex-col gap-5 animate-ios-fade-up">
        {/* Warning Banner */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[14px] text-red-700 dark:text-red-300 leading-relaxed">Use apenas em situacoes reais de perigo. Um alerta sera enviado para seus contatos de emergencia.</p>
        </div>

        {/* SOS Button with circular countdown */}
        <div className="bg-card rounded-3xl p-8 shadow-sm text-center">
          {countdown !== null ? (
            <div className="flex flex-col items-center gap-5">
              {/* Animated countdown ring */}
              <div className="relative w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth={4} className="text-red-100 dark:text-red-900/30" />
                  <circle
                    cx="64" cy="64" r="56" fill="none" strokeWidth={4}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - countdownProgress)}
                    strokeLinecap="round"
                    className="text-red-500 transition-all duration-1000 ease-linear"
                    stroke="currentColor"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[52px] font-bold text-red-500 tabular-nums animate-pulse">{countdown}</span>
                </div>
              </div>
              <p className="text-[15px] text-muted-foreground font-medium">Ativando emergencia...</p>
              <button
                type="button"
                onClick={cancelCountdown}
                className="w-full h-[52px] rounded-2xl bg-foreground text-background font-bold text-[17px] ios-press"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <button
                type="button"
                onClick={startCountdown}
                className="w-36 h-36 bg-red-500 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(239,68,68,0.4)] ios-press animate-ios-pulse"
              >
                <div className="text-center">
                  <svg className="w-12 h-12 text-white mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-[15px] font-bold text-white">SOS</span>
                </div>
              </button>
              <p className="text-[14px] text-muted-foreground">Toque para ativar alerta de emergencia</p>
            </div>
          )}
        </div>

        {/* Safety features row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Share location */}
          <button
            type="button"
            onClick={handleShareLocation}
            disabled={sharingLocation}
            className="bg-card rounded-2xl p-4 shadow-sm ios-press text-left flex flex-col gap-3"
          >
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/30 rounded-[14px] flex items-center justify-center">
              {sharingLocation ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">Compartilhar local</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Envie sua posicao em tempo real</p>
            </div>
          </button>

          {/* Audio recording */}
          <button
            type="button"
            onClick={toggleAudioRecording}
            className="bg-card rounded-2xl p-4 shadow-sm ios-press text-left flex flex-col gap-3 relative"
          >
            <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${
              audioRecording ? 'bg-red-500' : 'bg-orange-50 dark:bg-orange-900/30'
            }`}>
              {audioRecording ? (
                <div className="relative">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                </div>
              ) : (
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">
                {audioRecording ? 'Gravando...' : 'Gravar audio'}
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {audioRecording ? 'Toque para parar' : 'Audio criptografado da corrida'}
              </p>
            </div>
            {audioRecording && (
              <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>

        {/* Quick Call Buttons */}
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Ligar agora</p>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Policia Militar', number: '190', color: 'bg-blue-500' },
              { label: 'SAMU', number: '192', color: 'bg-emerald-500' },
              { label: 'Bombeiros', number: '193', color: 'bg-red-500' },
            ].map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className={`flex items-center gap-4 p-4 rounded-2xl ${item.color} ios-press shadow-lg`}
              >
                <div className="w-12 h-12 bg-white/20 rounded-[14px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[17px] font-semibold text-white">{item.label}</p>
                  <p className="text-[13px] text-white/70">{item.number}</p>
                </div>
                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Contatos de emergencia</p>
            <button type="button" onClick={() => router.push('/uppi/emergency-contacts')} className="text-blue-500 text-[13px] font-semibold ios-press">Editar</button>
          </div>
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
            {emergencyContacts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-[15px] font-medium text-foreground mb-0.5">Nenhum contato</p>
                <p className="text-[13px] text-muted-foreground">Adicione contatos de emergencia</p>
              </div>
            ) : (
              emergencyContacts.map((contact: any, index: number) => (
                <a
                  key={index}
                  href={`tel:${contact.phone}`}
                  className={`flex items-center gap-3.5 px-5 py-4 ios-press ${
                    index < emergencyContacts.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="w-11 h-11 bg-red-50 dark:bg-red-900/20 rounded-[14px] flex items-center justify-center shrink-0">
                    <svg className="w-[22px] h-[22px] text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[17px] font-medium text-foreground">{contact.name}</p>
                    <p className="text-[13px] text-muted-foreground">{contact.phone}</p>
                  </div>
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Share link if generated */}
        {shareLink && (
          <div className="bg-card rounded-2xl p-4 shadow-sm animate-ios-fade-up">
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Link da sua localizacao</p>
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={shareLink}
                className="flex-1 bg-secondary rounded-xl px-3 py-2.5 text-[14px] text-foreground font-mono truncate"
              />
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(shareLink); iosToast.success('Copiado') }}
                className="h-[42px] px-4 bg-blue-500 text-white rounded-xl text-[14px] font-bold ios-press shrink-0"
              >
                Copiar
              </button>
            </div>
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  )
}
