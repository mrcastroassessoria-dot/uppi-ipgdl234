'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { iosToast } from '@/lib/utils/ios-toast'
import { triggerHaptic } from '@/hooks/use-haptic'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 14.90,
    period: '/mes',
    color: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/25',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    benefits: [
      { text: '5% de desconto em todas as corridas', highlight: true },
      { text: 'Prioridade na fila de motoristas', highlight: false },
      { text: 'Suporte via chat prioritario', highlight: false },
      { text: '1 cupom de R$ 5 por mes', highlight: false },
    ],
    discount: 5,
    cashback: 0,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.90,
    period: '/mes',
    color: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/25',
    popular: true,
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    benefits: [
      { text: '12% de desconto em todas as corridas', highlight: true },
      { text: '3% de cashback em creditos Uppi', highlight: true },
      { text: 'Motoristas premium exclusivos', highlight: false },
      { text: 'Suporte 24h prioritario', highlight: false },
      { text: '3 cupons de R$ 5 por mes', highlight: false },
      { text: 'Cancelamento gratis (2x/mes)', highlight: false },
    ],
    discount: 12,
    cashback: 3,
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 49.90,
    period: '/mes',
    color: 'from-purple-600 to-violet-600',
    shadow: 'shadow-purple-500/25',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V17M6 3H18M6 3V8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8V3M6 3H4C4 5 3 8 3 8M18 3H20C20 5 21 8 21 8M8 21H16M12 17V21" />
      </svg>
    ),
    benefits: [
      { text: '20% de desconto em todas as corridas', highlight: true },
      { text: '5% de cashback em creditos Uppi', highlight: true },
      { text: 'Acesso a veiculos premium e SUV', highlight: true },
      { text: 'Suporte VIP com atendente dedicado', highlight: false },
      { text: '5 cupons de R$ 10 por mes', highlight: false },
      { text: 'Cancelamento gratis ilimitado', highlight: false },
      { text: 'Corridas agendadas com prioridade', highlight: false },
      { text: 'Seguro viagem incluso', highlight: false },
    ],
    discount: 20,
    cashback: 5,
  },
]

export default function ClubUppiPage() {
  const router = useRouter()
  const supabase = createClient()
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      if (data) setCurrentPlan(data.plan)
    }
    fetchSubscription()
  }, [supabase])

  const handleSubscribe = async () => {
    setSubscribing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/onboarding/create-account')
        return
      }

      const plan = plans.find(p => p.id === selectedPlan)
      if (!plan) return

      const now = new Date()
      const expires = new Date(now)
      expires.setMonth(expires.getMonth() + 1)

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: selectedPlan,
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
          auto_renew: true,
          discount_rides: plan.discount,
          priority_support: selectedPlan !== 'basic',
          cashback_percent: plan.cashback,
        }, { onConflict: 'user_id' })

      if (!error) {
        setShowSuccess(true)
        setCurrentPlan(selectedPlan)
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } finally {
      setSubscribing(false)
    }
  }

  const activePlan = plans.find(p => p.id === selectedPlan)

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card/80 ios-blur border-b border-border/40 sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center ios-press"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[20px] font-bold text-foreground tracking-tight">Club Uppi</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-10 pt-5">
        {/* Hero */}
        <div className="text-center mb-6 animate-ios-fade-up">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[22px] mx-auto mb-3 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V17M6 3H18M6 3V8C6 11.3137 8.68629 14 12 14C15.3137 14 18 11.3137 18 8V3M6 3H4C4 5 3 8 3 8M18 3H20C20 5 21 8 21 8M8 21H16M12 17V21" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-foreground text-balance">Economize em cada corrida</h2>
          <p className="text-[15px] text-muted-foreground mt-1 text-pretty">Assine o Club Uppi e tenha descontos exclusivos, cashback e muito mais.</p>
        </div>

        {/* Current plan badge */}
        {currentPlan && (
          <div className="flex items-center justify-center gap-2 mb-5 animate-ios-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[13px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Plano {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} ativo
            </div>
          </div>
        )}

        {/* Plan selector pills */}
        <div className="flex gap-2 mb-5 animate-ios-fade-up" style={{ animationDelay: '100ms' }}>
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`flex-1 relative py-2.5 rounded-[14px] text-[14px] font-bold text-center transition-all duration-200 ios-press ${
                selectedPlan === plan.id
                  ? `bg-gradient-to-r ${plan.color} text-white shadow-lg ${plan.shadow}`
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Popular
                </span>
              )}
              {plan.name}
            </button>
          ))}
        </div>

        {/* Selected plan details */}
        {activePlan && (
          <div className="animate-ios-fade-up" style={{ animationDelay: '150ms' }}>
            {/* Price card */}
            <div className={`bg-gradient-to-br ${activePlan.color} rounded-[22px] p-5 mb-4 shadow-xl ${activePlan.shadow}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-[16px] flex items-center justify-center">
                  {activePlan.icon}
                </div>
                <div>
                  <p className="text-[13px] text-white/70 font-medium">Plano {activePlan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-black text-white leading-none">R$ {activePlan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-[14px] text-white/60 font-medium">{activePlan.period}</span>
                  </div>
                </div>
              </div>

              {/* Highlight stats */}
              <div className="flex gap-3">
                <div className="flex-1 bg-white/15 rounded-[14px] p-3 text-center">
                  <p className="text-[22px] font-black text-white">{activePlan.discount}%</p>
                  <p className="text-[11px] text-white/70 font-medium">Desconto</p>
                </div>
                {activePlan.cashback > 0 && (
                  <div className="flex-1 bg-white/15 rounded-[14px] p-3 text-center">
                    <p className="text-[22px] font-black text-white">{activePlan.cashback}%</p>
                    <p className="text-[11px] text-white/70 font-medium">Cashback</p>
                  </div>
                )}
                <div className="flex-1 bg-white/15 rounded-[14px] p-3 text-center">
                  <p className="text-[22px] font-black text-white">24h</p>
                  <p className="text-[11px] text-white/70 font-medium">Suporte</p>
                </div>
              </div>
            </div>

            {/* Benefits list */}
            <div className="bg-card rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] mb-5">
              <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide px-5 pt-4 pb-2">Beneficios incluidos</p>
              {activePlan.benefits.map((benefit, i) => (
                <div key={i} className={`flex items-start gap-3 px-5 py-3 ${i < activePlan.benefits.length - 1 ? 'border-b border-border/50' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    benefit.highlight ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-secondary'
                  }`}>
                    <svg className={`w-3.5 h-3.5 ${benefit.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`text-[15px] leading-snug ${benefit.highlight ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Savings calculator */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[18px] p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
                <span className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400">Simulacao de economia</span>
              </div>
              <p className="text-[13px] text-emerald-600/80 dark:text-emerald-400/70 leading-relaxed">
                Com 20 corridas de R$ 25 por mes, voce economiza{' '}
                <span className="font-black text-emerald-700 dark:text-emerald-300">
                  R$ {(20 * 25 * (activePlan.discount / 100) - activePlan.price).toFixed(2).replace('.', ',')}
                </span>{' '}
                alem da assinatura. O plano se paga em{' '}
                <span className="font-bold">{Math.ceil(activePlan.price / (25 * activePlan.discount / 100))} corridas</span>.
              </p>
            </div>

            {/* Subscribe button */}
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing || currentPlan === selectedPlan}
              className={`w-full py-4 rounded-[16px] text-[17px] font-bold text-center ios-press transition-all duration-200 ${
                currentPlan === selectedPlan
                  ? 'bg-secondary text-muted-foreground'
                  : `bg-gradient-to-r ${activePlan.color} text-white shadow-lg ${activePlan.shadow}`
              } disabled:opacity-50`}
            >
              {subscribing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processando...
                </span>
              ) : currentPlan === selectedPlan ? (
                'Plano atual'
              ) : currentPlan ? (
                `Trocar para ${activePlan.name}`
              ) : (
                `Assinar ${activePlan.name} - R$ ${activePlan.price.toFixed(2).replace('.', ',')}/mes`
              )}
            </button>

            <p className="text-[12px] text-muted-foreground/60 text-center mt-3">
              Cancele a qualquer momento. Sem fidelidade.
            </p>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-6 animate-ios-fade-up" style={{ animationDelay: '200ms' }}>
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Perguntas frequentes</p>
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Sem multa ou fidelidade. O plano fica ativo ate o fim do periodo pago.' },
            { q: 'Como funciona o cashback?', a: 'O cashback e creditado na sua carteira Uppi apos cada corrida e pode ser usado como pagamento.' },
            { q: 'O desconto vale para todas as corridas?', a: 'Sim, o desconto e aplicado automaticamente em todas as corridas, incluindo agendadas.' },
          ].map((faq, i) => (
            <details key={i} className="bg-card rounded-[16px] mb-2 overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2)] group">
              <summary className="px-4 py-3.5 text-[15px] font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <svg className="w-4 h-4 text-muted-foreground/50 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-4 pb-3.5 text-[14px] text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </main>

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 animate-ios-fade-up">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[15px] font-bold">Assinatura ativada com sucesso!</span>
        </div>
      )}
    </div>
  )
}
