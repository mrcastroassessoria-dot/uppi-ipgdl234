'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const errorParam = searchParams.get('error') || 'Ocorreu um erro na autenticação'
    setError(errorParam)
  }, [searchParams])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">
          Erro de Autenticação
        </h1>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400">
          {error}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full rounded-xl py-6 text-base"
          >
            Tentar Novamente
          </Button>
          <Button
            onClick={() => router.push('/auth/welcome')}
            variant="outline"
            className="w-full rounded-xl py-6 text-base"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  )
}
