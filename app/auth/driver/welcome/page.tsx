'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

const driverSlides = [
  {
    id: 0,
    title: 'Seja seu\npróprio chefe',
    subtitle: 'Defina seus horários e trabalhe quando quiser',
    image: '/images/driver-onboarding-1.jpg',
  },
  {
    id: 1,
    title: 'Ganhe mais\ncom autonomia',
    subtitle: 'Você define o preço das suas corridas',
    image: '/images/driver-onboarding-2.jpg',
  },
  {
    id: 2,
    title: 'Suporte\n24 horas',
    subtitle: 'Estamos sempre aqui para ajudar você',
    image: '/images/driver-onboarding-3.jpg',
  },
]

export default function DriverWelcomePage() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">
      {/* Background Image */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/driver-welcome-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}
        >
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all active:scale-95"
          >
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Brand label */}
        <div className="mt-4 flex items-center gap-2.5 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#34C759]/90 backdrop-blur">
            <svg className="h-[18px] w-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <span className="text-[15px] font-medium text-white/90">Uppi Motorista</span>
        </div>

        {/* Headline */}
        <div className="relative mt-8 min-h-0 flex-1 px-6">
          <h1 className="whitespace-pre-line text-[36px] font-bold leading-[1.08] tracking-tight text-white sm:text-[44px]">
            Dirija e ganhe{'\n'}no seu tempo
          </h1>
          <p className="mt-4 max-w-[340px] text-[17px] leading-relaxed text-white/80 sm:text-[19px]">
            Comece a dirigir hoje e tenha total controle sobre seus ganhos
          </p>

          {/* Features */}
          <div className="mt-8 space-y-3">
            {[
              { icon: '💰', text: 'Defina seus próprios preços' },
              { icon: '⏰', text: 'Trabalhe quando quiser' },
              { icon: '📈', text: 'Maximize seus ganhos' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-[15px] font-medium text-white">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="shrink-0 px-5 pt-6 sm:px-6 sm:pt-7" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
          <button
            onClick={() => router.push('/auth/driver/sign-up')}
            className="w-full rounded-full bg-[#34C759] py-4 text-base font-semibold text-white shadow-lg shadow-green-500/30 transition-all active:scale-[0.98] sm:py-[16px] sm:text-[17px]"
          >
            Começar a dirigir
          </button>

          <button
            onClick={() => router.push('/auth/driver/login')}
            className="mt-2.5 w-full rounded-full bg-white/10 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all active:scale-[0.98] sm:mt-3 sm:py-[16px] sm:text-[17px]"
          >
            Já sou motorista
          </button>
        </div>
      </div>
    </div>
  )
}
