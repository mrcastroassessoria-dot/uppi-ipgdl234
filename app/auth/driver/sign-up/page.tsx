'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth-service'
import { iosToast } from '@/lib/utils/ios-toast'
import { FcGoogle } from 'react-icons/fc'
import { FaApple } from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'

export default function DriverSignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { user, error } = await authService.signUp({
        email,
        password,
        name,
        phone,
      })

      if (error) {
        iosToast.error(error)
        return
      }

      if (user) {
        // Definir como motorista
        const supabase = createClient()
        await supabase
          .from('profiles')
          .update({ user_type: 'driver' })
          .eq('id', user.id)

        iosToast.success('Conta criada! Complete seu cadastro.')
        router.push('/uppi/driver/register')
      }
    } catch (error) {
      console.error('[v0] Sign up exception:', error)
      iosToast.error('Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      const { error } = await authService.signInWithGoogle()
      if (error) {
        iosToast.error(error)
      }
    } catch (error) {
      iosToast.error('Erro ao fazer cadastro com Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleSignUp = async () => {
    setIsLoading(true)
    try {
      const { error } = await authService.signInWithApple()
      if (error) {
        iosToast.error(error)
      }
    } catch (error) {
      iosToast.error('Erro ao fazer cadastro com Apple')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4"
        style={{ paddingTop: 'max(16px, calc(env(safe-area-inset-top, 0px) + 16px))' }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900 transition-colors active:scale-95"
        >
          <svg className="h-5 w-5 text-neutral-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-neutral-900 dark:text-white">Cadastro Motorista</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-8">
        <div className="mx-auto max-w-md">
          {/* Icon Badge */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34C759] to-[#30D158]">
            <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="mb-2 text-[28px] font-bold text-neutral-900 dark:text-white">Comece a dirigir</h2>
          <p className="mb-8 text-[15px] text-neutral-500 dark:text-neutral-400">
            Crie sua conta e comece a ganhar hoje mesmo
          </p>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                required
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5 text-[16px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[#34C759] focus:outline-none focus:ring-2 focus:ring-[#34C759]/20"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5 text-[16px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[#34C759] focus:outline-none focus:ring-2 focus:ring-[#34C759]/20"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5 text-[16px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[#34C759] focus:outline-none focus:ring-2 focus:ring-[#34C759]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3.5 text-[16px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-[#34C759] focus:outline-none focus:ring-2 focus:ring-[#34C759]/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full rounded-[14px] bg-[#34C759] py-4 text-[17px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-50"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-black px-4 text-[13px] text-neutral-400">ou cadastre-se com</span>
            </div>
          </div>

          {/* Social Sign Up */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors active:scale-95 disabled:opacity-50"
            >
              <FcGoogle className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleAppleSignUp}
              disabled={isLoading}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors active:scale-95 disabled:opacity-50"
            >
              <FaApple className="h-6 w-6 text-black dark:text-white" />
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center pb-8">
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">
              Já tem uma conta?{' '}
              <button
                onClick={() => router.push('/auth/driver/login')}
                className="font-semibold text-[#34C759] active:opacity-70 transition-opacity"
              >
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
