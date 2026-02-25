'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { iosToast } from '@/lib/utils/ios-toast'
import { triggerHaptic } from '@/lib/utils/haptics'

interface PixQrCodeProps {
  qrCode: string // Base64 do QR Code
  qrCodeText: string // Código PIX copia e cola
  amount: number // em centavos
  expiresAt: string
  onPaymentConfirmed: () => void
  paymentId: string
}

export function PixQrCode({ 
  qrCode, 
  qrCodeText, 
  amount, 
  expiresAt,
  onPaymentConfirmed,
  paymentId 
}: PixQrCodeProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const distance = expiry - now

      if (distance < 0) {
        setTimeLeft('Expirado')
        return
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeText)
      setCopied(true)
      iosToast.success('Código PIX copiado!')
      triggerHaptic('light')
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      console.error('[v0] Copy error:', error)
      iosToast.error('Erro ao copiar código')
    }
  }

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Pague com PIX
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </div>

      {/* Amount */}
      <Card className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-center">
        <div className="text-white/80 text-sm mb-1">Total a pagar</div>
        <div className="text-4xl font-bold text-white">{formatAmount(amount)}</div>
      </Card>

      {/* QR Code */}
      <Card className="p-6 bg-white dark:bg-neutral-900">
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
            <Image
              src={`data:image/png;base64,${qrCode}`}
              alt="QR Code PIX"
              width={280}
              height={280}
              className="w-full h-auto"
              priority
            />
          </div>
          
          {/* Timer */}
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-neutral-600 dark:text-neutral-400">
              Expira em: <span className="font-semibold text-neutral-900 dark:text-white">{timeLeft}</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Copy Code */}
      <Card className="p-4 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="mb-3">
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Código PIX Copia e Cola
          </label>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 mb-3 border border-neutral-200 dark:border-neutral-700">
          <code className="text-xs text-neutral-800 dark:text-neutral-300 break-all leading-relaxed font-mono">
            {qrCodeText}
          </code>
        </div>
        <Button
          onClick={handleCopyCode}
          className="w-full"
          variant={copied ? "default" : "outline"}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Código Copiado!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar Código PIX
            </>
          )}
        </Button>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1">Como pagar:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-400">
              <li>Abra o app do seu banco</li>
              <li>Escolha pagar com PIX</li>
              <li>Escaneie o QR Code ou cole o código</li>
              <li>Confirme o pagamento</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Loading indicator */}
      <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        <div className="inline-flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Aguardando confirmação do pagamento...
        </div>
      </div>
    </div>
  )
}
