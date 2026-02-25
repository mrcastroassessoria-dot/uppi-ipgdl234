'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { BottomNavigation } from '@/components/bottom-navigation'

export default function SegurancaPage() {
  const router = useRouter()
  const [shareLocation, setShareLocation] = useState(true)
  const [rideRecording, setRideRecording] = useState(false)
  const [trustedContacts, setTrustedContacts] = useState(true)

  const securityFeatures = [
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Verificacao de motoristas',
      desc: 'Todos os motoristas passam por checagem de antecedentes',
      color: 'text-green-500 bg-green-50',
    },
    {
      icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      title: 'Monitoramento da viagem',
      desc: 'Acompanhe todo o trajeto em tempo real',
      color: 'text-blue-500 bg-blue-50',
    },
    {
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      title: 'Dados criptografados',
      desc: 'Suas informacoes pessoais sao protegidas',
      color: 'text-indigo-500 bg-indigo-50',
    },
  ]

  return (
    <div className="h-dvh overflow-y-auto bg-neutral-50 pb-24 ios-scroll">
      {/* Header */}
      <header className="bg-white/95 ios-blur border-b border-neutral-200/60 sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full ios-press">
              <svg className="w-[22px] h-[22px] text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[20px] font-bold text-neutral-900 tracking-tight">Seguranca</h1>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto space-y-6 animate-ios-fade-up">
        {/* SOS Card */}
        <button
          type="button"
          onClick={() => router.push('/uppi/emergency')}
          className="w-full ios-card-elevated p-6 flex items-center gap-4 ios-press"
        >
          <div className="w-16 h-16 bg-red-500 rounded-[22px] flex items-center justify-center animate-ios-pulse flex-shrink-0">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-[20px] font-bold text-neutral-900 tracking-tight">Botao SOS</h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">Acione em caso de emergencia</p>
          </div>
          <svg className="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Toggles */}
        <div>
          <p className="ios-section-header">Preferencias de seguranca</p>
          <div className="ios-list-group">
            <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-100/80">
              <div className="flex-1 pr-4">
                <p className="text-[17px] font-medium text-neutral-900">Compartilhar localizacao</p>
                <p className="text-[13px] text-neutral-500 mt-0.5">Com contatos de confianca durante corridas</p>
              </div>
              <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
            </div>
            <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-100/80">
              <div className="flex-1 pr-4">
                <p className="text-[17px] font-medium text-neutral-900">Gravacao de audio</p>
                <p className="text-[13px] text-neutral-500 mt-0.5">Gravar audio durante viagens para seguranca</p>
              </div>
              <Switch checked={rideRecording} onCheckedChange={setRideRecording} />
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-[17px] font-medium text-neutral-900">Contatos de confianca</p>
                <p className="text-[13px] text-neutral-500 mt-0.5">Notificar ao iniciar e finalizar corridas</p>
              </div>
              <Switch checked={trustedContacts} onCheckedChange={setTrustedContacts} />
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <p className="ios-section-header">Contatos de emergencia</p>
          <div className="ios-list-group">
            <button type="button" onClick={() => router.push('/uppi/emergency-contacts')} className="w-full ios-list-item ios-press">
              <div className="w-11 h-11 bg-blue-50 rounded-[14px] flex items-center justify-center flex-shrink-0">
                <svg className="w-[22px] h-[22px] text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[17px] font-medium text-neutral-900">Gerenciar contatos</p>
                <p className="text-[13px] text-neutral-500 mt-0.5">Adicionar ou editar contatos de emergencia</p>
              </div>
              <svg className="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Security Features */}
        <div>
          <p className="ios-section-header">Como te protegemos</p>
          <div className="space-y-3 stagger-children">
            {securityFeatures.map((feature, i) => (
              <div key={i} className="ios-card p-5 flex items-start gap-4">
                <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-neutral-900">{feature.title}</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Dial */}
        <div>
          <p className="ios-section-header">Numeros de emergencia</p>
          <div className="ios-list-group">
            {[
              { label: 'Policia Militar', number: '190', color: 'bg-blue-500' },
              { label: 'SAMU', number: '192', color: 'bg-green-500' },
              { label: 'Bombeiros', number: '193', color: 'bg-red-500' },
            ].map((item, i) => (
              <a
                key={i}
                href={`tel:${item.number}`}
                className={`ios-list-item ios-press ${i < 2 ? 'border-b border-neutral-100/80' : ''}`}
              >
                <div className={`w-11 h-11 ${item.color} rounded-[14px] flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-[22px] h-[22px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[17px] font-medium text-neutral-900">{item.label}</p>
                  <p className="text-[13px] text-neutral-500">{item.number}</p>
                </div>
                <svg className="w-5 h-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
