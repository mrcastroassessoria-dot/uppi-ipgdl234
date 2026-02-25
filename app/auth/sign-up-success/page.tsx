'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="w-full max-w-md text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-white">
          Conta Criada com Sucesso!
        </h1>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400">
          Verifique seu email para confirmar sua conta e começar a usar o Uppi.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/uppi/home')}
            className="w-full rounded-xl py-6 text-base"
          >
            Ir para o App
          </Button>
          <Button
            onClick={() => router.push('/auth/login')}
            variant="outline"
            className="w-full rounded-xl py-6 text-base"
          >
            Fazer Login
          </Button>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          Não recebeu o email?{' '}
          <button
            onClick={() => router.push('/auth/sign-up')}
            className="text-blue-600 dark:text-blue-500 underline"
          >
            Reenviar
          </button>
        </p>
      </div>
    </div>
  )
}
