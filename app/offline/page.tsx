'use client'

import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const router = useRouter()

  return (
    <div className="h-dvh bg-background flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 bg-secondary rounded-[24px] flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
      </div>
      <h1 className="text-[24px] font-bold text-foreground text-balance mb-2">Sem conexao</h1>
      <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 text-pretty">
        Parece que voce esta sem internet. Verifique sua conexao e tente novamente.
      </p>
      <button
        type="button"
        onClick={() => {
          router.refresh()
          window.location.reload()
        }}
        className="bg-blue-500 text-white font-bold text-[16px] px-8 py-3.5 rounded-[14px] ios-press shadow-lg shadow-blue-500/25"
      >
        Tentar novamente
      </button>
    </div>
  )
}
