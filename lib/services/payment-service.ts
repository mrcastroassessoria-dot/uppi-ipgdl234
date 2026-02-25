'use client'

import { createClient } from '@/lib/supabase/client'

export interface PixPaymentRequest {
  amount: number // em centavos (ex: 2500 = R$ 25,00)
  description: string
  payer_name: string
  payer_cpf: string
  ride_id: string
}

export interface PixPaymentResponse {
  success: boolean
  payment_id?: string
  qr_code?: string // QR Code em base64
  qr_code_text?: string // Código PIX copia e cola
  expires_at?: string
  error?: string
}

export interface PaymentStatus {
  payment_id: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  paid_at?: string
  amount: number
}

class PaymentService {
  private baseUrl = process.env.NEXT_PUBLIC_GATEWAY_PARADISE_URL || 'https://api.gatewayparadise.com/v1'
  private apiKey = process.env.NEXT_PUBLIC_GATEWAY_PARADISE_API_KEY || ''

  /**
   * Cria um pagamento PIX e retorna o QR Code
   */
  async createPixPayment(request: PixPaymentRequest): Promise<PixPaymentResponse> {
    try {
      console.log('[v0] Creating PIX payment:', request)

      // Chamar API do Gateway Paradise
      const response = await fetch(`${this.baseUrl}/pix/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: request.amount,
          description: request.description,
          payer: {
            name: request.payer_name,
            cpf: request.payer_cpf,
          },
          metadata: {
            ride_id: request.ride_id,
          },
        }),
      })

      if (!response.ok) {
        console.error('[v0] Gateway Paradise error:', response.status)
        return {
          success: false,
          error: 'Erro ao gerar PIX. Tente novamente.',
        }
      }

      const data = await response.json()

      // Salvar no Supabase
      const supabase = createClient()
      const { error: dbError } = await supabase.from('payments').insert({
        id: data.payment_id,
        ride_id: request.ride_id,
        amount: request.amount / 100, // Converter para reais
        payment_method: 'pix',
        status: 'pending',
        pix_qr_code: data.qr_code,
        pix_qr_code_text: data.qr_code_text,
        expires_at: data.expires_at,
      })

      if (dbError) {
        console.error('[v0] Database error:', dbError)
      }

      console.log('[v0] PIX payment created:', data.payment_id)

      return {
        success: true,
        payment_id: data.payment_id,
        qr_code: data.qr_code,
        qr_code_text: data.qr_code_text,
        expires_at: data.expires_at,
      }
    } catch (error) {
      console.error('[v0] Payment error:', error)
      return {
        success: false,
        error: 'Erro ao processar pagamento',
      }
    }
  }

  /**
   * Verifica o status de um pagamento PIX
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    try {
      console.log('[v0] Checking payment status:', paymentId)

      const response = await fetch(`${this.baseUrl}/pix/charge/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        console.error('[v0] Status check error:', response.status)
        return null
      }

      const data = await response.json()

      // Atualizar no Supabase
      if (data.status === 'paid') {
        const supabase = createClient()
        await supabase.from('payments').update({
          status: 'completed',
          paid_at: data.paid_at,
        }).eq('id', paymentId)

        await supabase.from('rides').update({
          payment_status: 'completed',
        }).eq('id', data.metadata?.ride_id)

        console.log('[v0] Payment confirmed:', paymentId)
      }

      return {
        payment_id: paymentId,
        status: data.status,
        paid_at: data.paid_at,
        amount: data.amount,
      }
    } catch (error) {
      console.error('[v0] Status check error:', error)
      return null
    }
  }

  /**
   * Cancela um pagamento PIX
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      console.log('[v0] Cancelling payment:', paymentId)

      const response = await fetch(`${this.baseUrl}/pix/charge/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        return false
      }

      // Atualizar no Supabase
      const supabase = createClient()
      await supabase.from('payments').update({
        status: 'cancelled',
      }).eq('id', paymentId)

      console.log('[v0] Payment cancelled:', paymentId)
      return true
    } catch (error) {
      console.error('[v0] Cancel error:', error)
      return false
    }
  }

  /**
   * Processa pagamento em carteira digital
   */
  async processWalletPayment(rideId: string, userId: string, amount: number): Promise<boolean> {
    const supabase = createClient()

    try {
      console.log('[v0] Processing wallet payment:', { rideId, userId, amount })

      // Verificar saldo
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (!wallet || wallet.balance < amount) {
        console.error('[v0] Insufficient balance')
        return false
      }

      // Criar transação
      const { error: txError } = await supabase.from('wallet_transactions').insert({
        user_id: userId,
        amount: -amount,
        type: 'ride_payment',
        description: `Pagamento da corrida`,
        ride_id: rideId,
      })

      if (txError) {
        console.error('[v0] Transaction error:', txError)
        return false
      }

      // Atualizar saldo
      await supabase
        .from('user_wallets')
        .update({ balance: wallet.balance - amount })
        .eq('user_id', userId)

      // Atualizar corrida
      await supabase
        .from('rides')
        .update({ payment_status: 'completed' })
        .eq('id', rideId)

      // Criar registro de pagamento
      await supabase.from('payments').insert({
        ride_id: rideId,
        amount,
        payment_method: 'wallet',
        status: 'completed',
        paid_at: new Date().toISOString(),
      })

      console.log('[v0] Wallet payment completed')
      return true
    } catch (error) {
      console.error('[v0] Wallet payment error:', error)
      return false
    }
  }
}

export const paymentService = new PaymentService()
