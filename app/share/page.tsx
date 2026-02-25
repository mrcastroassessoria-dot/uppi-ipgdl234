'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { handleDeepLink } from '@/lib/utils/deep-links'
import { Loader2 } from 'lucide-react'

function SharePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get full URL with params
    const url = typeof window !== 'undefined' ? window.location.href : ''
    
    // Handle the deep link
    if (url) {
      handleDeepLink(url, router)
    } else {
      // Fallback to home if no params
      setTimeout(() => router.push('/uppi/home'), 1000)
    }
  }, [router, searchParams])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        </div>
        <h2 className="text-[20px] font-bold mb-2">Abrindo link...</h2>
        <p className="text-[14px] text-muted-foreground">
          Você será redirecionado em instantes
        </p>
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    }>
      <SharePageContent />
    </Suspense>
  )
}
