'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNavigation } from '@/components/bottom-navigation'

export default function CidadeACidadePage() {
  const router = useRouter()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

  const popularRoutes = [
    { from: 'Sao Paulo', to: 'Campinas', distance: '99 km', time: '~1h30', price: 'R$ 120-180' },
    { from: 'Sao Paulo', to: 'Santos', distance: '72 km', time: '~1h10', price: 'R$ 90-140' },
    { from: 'Sao Paulo', to: 'Sorocaba', distance: '100 km', time: '~1h30', price: 'R$ 110-170' },
    { from: 'Rio de Janeiro', to: 'Niteroi', distance: '25 km', time: '~40min', price: 'R$ 50-80' },
  ]

  const benefits = [
    { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Preco negociavel', desc: 'Voce define quanto quer pagar' },
    { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', title: 'Porta a porta', desc: 'Buscamos e levamos voce' },
    { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Horario flexivel', desc: 'Escolha quando quer viajar' },
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
            <h1 className="text-[20px] font-bold text-neutral-900 tracking-tight">Cidade a Cidade</h1>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto space-y-6 animate-ios-fade-up">
        {/* Hero */}
        <div className="ios-card-elevated p-6">
          <h2 className="text-[24px] font-bold text-neutral-900 tracking-tight mb-1">Viaje entre cidades</h2>
          <p className="text-[15px] text-neutral-500 mb-5">Com conforto e preco justo</p>

          {/* Route Inputs */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
              <input
                type="text"
                placeholder="Cidade de origem"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="flex-1 h-[48px] px-4 bg-neutral-100/80 rounded-[14px] text-[17px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-500/30 ios-smooth"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0" />
              <input
                type="text"
                placeholder="Cidade de destino"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="flex-1 h-[48px] px-4 bg-neutral-100/80 rounded-[14px] text-[17px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-500/30 ios-smooth"
              />
            </div>
          </div>

          <button
            type="button"
            className="w-full h-[52px] rounded-[16px] bg-blue-500 text-white font-semibold text-[17px] mt-5 ios-press shadow-[0_4px_16px_rgba(59,130,246,0.3)]"
          >
            Buscar motoristas
          </button>
        </div>

        {/* Benefits */}
        <div>
          <p className="ios-section-header">Vantagens</p>
          <div className="grid grid-cols-3 gap-3 stagger-children">
            {benefits.map((b, i) => (
              <div key={i} className="ios-card p-4 text-center">
                <div className="w-11 h-11 bg-blue-50 rounded-[14px] flex items-center justify-center mx-auto mb-2.5">
                  <svg className="w-[22px] h-[22px] text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-neutral-900 mb-0.5">{b.title}</p>
                <p className="text-[11px] text-neutral-500 leading-snug">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Routes */}
        <div>
          <p className="ios-section-header">Rotas Populares</p>
          <div className="ios-list-group">
            {popularRoutes.map((route, i) => (
              <button key={i} type="button" className={`w-full ios-list-item ios-press ${i < popularRoutes.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-semibold text-neutral-900">{route.from}</span>
                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="text-[15px] font-semibold text-neutral-900">{route.to}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-neutral-500">{route.distance}</span>
                    <span className="text-[12px] text-neutral-400">|</span>
                    <span className="text-[12px] text-neutral-500">{route.time}</span>
                  </div>
                </div>
                <span className="text-[15px] font-bold text-blue-500">{route.price}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
