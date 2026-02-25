'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/bottom-navigation'
import { iosToast } from '@/lib/utils/ios-toast'
import { haptics } from '@/lib/utils/ios-haptics'
import { EmptyState } from '@/components/empty-state'
import { IOSCard } from '@/components/ui/ios-card'
import { IOSBadge } from '@/components/ui/ios-badge'
import { IOSListItem } from '@/components/ui/ios-list-item'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, CreditCard, Smartphone, DollarSign, Shield, ArrowLeft, Plus, CheckCircle2 } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  ride_id?: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState('wallet')

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load wallet transactions (which represent payments)
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      // Transform to payment format
      const formattedPayments = (data || []).map(t => ({
        id: t.id,
        amount: parseFloat(t.amount),
        payment_method: 'wallet',
        status: 'completed',
        created_at: t.created_at,
        ride_id: t.ride_id
      }))
      
      setPayments(formattedPayments)
    } catch (error) {
      console.error('[v0] Error loading payments:', error)
      iosToast.error('Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }

  const paymentMethods = [
    { id: 'wallet', name: 'Carteira Uppi', iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'pix', name: 'PIX', iconPath: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'cash', name: 'Dinheiro', iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Pago'
      case 'pending': return 'Pendente'
      case 'failed': return 'Falhou'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-[2.5px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-dvh overflow-y-auto bg-gradient-to-b from-[#F2F2F7] via-[#FAFAFA] to-white dark:from-black dark:via-[#0A0A0A] dark:to-[#111111] pb-28 ios-scroll">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow-delayed" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 dark:bg-black/80 ios-blur-heavy border-b border-black/[0.08] dark:border-white/[0.08] sticky top-0">
        <div className="px-5 pt-safe-offset-4 pb-4">
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => {
                haptics.impactLight()
                router.back()
              }} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/60 ios-press"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            </button>
            <div className="flex-1">
              <h1 className="text-[28px] font-bold text-foreground tracking-tight">Pagamentos</h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">Gerencie seus métodos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-5 py-6 max-w-2xl mx-auto space-y-6">
        {/* Default method card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <IOSCard variant="glass" className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Método Padrão</p>
                <h3 className="text-[20px] font-bold text-foreground">Carteira Uppi</h3>
              </div>
              <IOSBadge variant="success">
                Ativo
              </IOSBadge>
            </div>
            <p className="text-[15px] text-muted-foreground">Pague suas corridas com saldo da carteira</p>
          </IOSCard>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[20px] font-bold text-foreground tracking-tight">Seus Métodos</h2>
            <button
              type="button"
              onClick={() => {
                haptics.impactMedium()
                iosToast.info('Em breve')
              }}
              className="flex items-center gap-2 text-blue-500 text-[15px] font-semibold ios-press"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Adicionar
            </button>
          </div>

          <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[24px] overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-lg">
            <AnimatePresence>
              {paymentMethods.map((method, i) => (
                <motion.button
                  key={method.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  type="button"
                  onClick={() => { 
                    haptics.selection()
                    setSelectedMethod(method.id)
                  }}
                  className={`w-full px-5 py-5 flex items-center gap-4 ios-press transition-colors ${
                    i < paymentMethods.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : ''
                  }`}
                >
                  <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center transition-all ${
                    selectedMethod === method.id 
                      ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
                      : 'bg-secondary/60'
                  }`}>
                    {method.id === 'wallet' ? (
                      <Wallet className={`w-6 h-6 ${selectedMethod === method.id ? 'text-white' : 'text-muted-foreground'}`} strokeWidth={2} />
                    ) : method.id === 'pix' ? (
                      <Smartphone className={`w-6 h-6 ${selectedMethod === method.id ? 'text-white' : 'text-muted-foreground'}`} strokeWidth={2} />
                    ) : (
                      <DollarSign className={`w-6 h-6 ${selectedMethod === method.id ? 'text-white' : 'text-muted-foreground'}`} strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[17px] font-semibold text-foreground">{method.name}</p>
                    {selectedMethod === method.id && (
                      <p className="text-[13px] text-blue-500 font-medium mt-0.5">Método padrão</p>
                    )}
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle2 className="w-6 h-6 text-blue-500 flex-shrink-0" strokeWidth={2.5} />
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Payment History - iOS grouped list */}
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Historico</p>
          {payments.length === 0 ? (
            <EmptyState preset="wallet" title="Sem pagamentos" description="Seus pagamentos aparecerao aqui" />
          ) : (
            <div className="bg-card rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {payments.map((payment, i) => (
                <div key={payment.id} className={`px-5 py-4 flex items-center justify-between ${i < payments.length - 1 ? 'border-b border-border' : ''}`}>
                  <div>
                    <p className="text-[17px] font-bold text-foreground">R$ {payment.amount.toFixed(2)}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security info - iOS style */}
        <div className="bg-card rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex gap-3.5">
            <div className="w-10 h-10 bg-green-50 rounded-[14px] flex items-center justify-center flex-shrink-0">
              <svg className="w-[22px] h-[22px] text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground mb-0.5">Dados seguros</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Todas as informacoes de pagamento sao criptografadas e protegidas.
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
