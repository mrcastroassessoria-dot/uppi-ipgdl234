'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNavigation } from '@/components/bottom-navigation'

export default function EntregasPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const deliveryTypes = [
    {
      id: 'document',
      title: 'Documento',
      subtitle: 'Envelopes e papeis',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      estimate: '30-45 min',
      price: 'A partir de R$ 8,00',
    },
    {
      id: 'small',
      title: 'Pacote Pequeno',
      subtitle: 'Ate 5kg - cabe numa mochila',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      estimate: '30-60 min',
      price: 'A partir de R$ 12,00',
    },
    {
      id: 'medium',
      title: 'Pacote Medio',
      subtitle: 'Ate 15kg - cabe no banco',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      estimate: '45-90 min',
      price: 'A partir de R$ 18,00',
    },
    {
      id: 'large',
      title: 'Pacote Grande',
      subtitle: 'Ate 30kg - porta-malas',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      estimate: '60-120 min',
      price: 'A partir de R$ 25,00',
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
            <h1 className="text-[20px] font-bold text-neutral-900 tracking-tight">Entregas</h1>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto space-y-6 animate-ios-fade-up">
        {/* Hero Card */}
        <div className="ios-card-elevated p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-blue-50 rounded-[18px] flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-neutral-900 tracking-tight">Envie qualquer coisa</h2>
              <p className="text-[15px] text-neutral-500">Rapido, seguro e com preco justo</p>
            </div>
          </div>
        </div>

        {/* Delivery Types */}
        <div>
          <p className="ios-section-header">O que voce quer enviar?</p>
          <div className="space-y-3 stagger-children">
            {deliveryTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`w-full ios-card p-5 flex items-center gap-4 ios-press text-left ios-smooth ${
                  selectedType === type.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center flex-shrink-0 ${
                  selectedType === type.id ? 'bg-blue-500 text-white' : 'bg-neutral-100 text-neutral-500'
                } ios-smooth`}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-semibold text-neutral-900">{type.title}</h3>
                  <p className="text-[13px] text-neutral-500 mt-0.5">{type.subtitle}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[12px] font-medium text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">{type.estimate}</span>
                    <span className="text-[12px] font-medium text-neutral-500">{type.price}</span>
                  </div>
                </div>
                <svg className={`w-5 h-5 flex-shrink-0 ios-smooth ${
                  selectedType === type.id ? 'text-blue-500' : 'text-neutral-300'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        {selectedType && (
          <div className="animate-ios-fade-up">
            <button
              type="button"
              onClick={() => router.push('/uppi/ride/route-input')}
              className="w-full h-[56px] rounded-[18px] bg-blue-500 text-white font-semibold text-[17px] ios-press shadow-[0_4px_16px_rgba(59,130,246,0.3)]"
            >
              Informar enderecos
            </button>
          </div>
        )}

        {/* Info */}
        <div className="ios-card p-5">
          <div className="flex gap-3.5">
            <div className="w-10 h-10 bg-green-50 rounded-[14px] flex items-center justify-center flex-shrink-0">
              <svg className="w-[22px] h-[22px] text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-neutral-900 mb-0.5">Entrega segura</p>
              <p className="text-[13px] text-neutral-500 leading-relaxed">
                Acompanhe sua entrega em tempo real e saiba exatamente quando ela chegara.
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
