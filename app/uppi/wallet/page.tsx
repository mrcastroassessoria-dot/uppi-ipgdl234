'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { realtimeService } from '@/lib/services/realtime-service'
import { BottomNavigation } from '@/components/bottom-navigation'
import WalletSkeleton from '@/components/wallet-skeleton'
import { iosToast } from '@/lib/utils/ios-toast'
import { haptics } from '@/lib/utils/ios-haptics'
import { EmptyState } from '@/components/empty-state'
import { walletTransactionSchema, validateForm } from '@/lib/validations/schemas'
import { IOSBottomSheet } from '@/components/ui/ios-bottom-sheet'
import { IOSInputEnhanced } from '@/components/ui/ios-input-enhanced'
import { IOSChip } from '@/components/ui/ios-chip'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, Plus, CreditCard, Wallet as WalletIcon, TrendingUp } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  ride_id?: string
  type: 'ride' | 'topup' | 'cashback'
}

export default function WalletPage() {
  const router = useRouter()
  const supabase = createClient()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    loadWalletData()
    
    // Subscribe to real-time wallet transactions
    const { data: { user } } = supabase.auth.getUser().then((res) => {
      if (res.data.user) {
        console.log('[v0] Setting up wallet realtime subscription')
        
        const channelId = realtimeService.subscribeToTable(
          'wallet_transactions',
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new.user_id === res.data.user.id) {
              console.log('[v0] New wallet transaction:', payload.new)
              
              // Add to transactions list
              setTransactions(prev => [payload.new as Payment, ...prev])
              
              // Update balance
              if (payload.new.type === 'credit') {
                setBalance(prev => prev + parseFloat(payload.new.amount))
                iosToast.success(`+R$ ${parseFloat(payload.new.amount).toFixed(2)}`)
                haptics.notification('success')
              } else if (payload.new.type === 'debit') {
                setBalance(prev => prev - parseFloat(payload.new.amount))
              }
            }
          },
          `user_id=eq.${res.data.user.id}`
        )
        
        return () => {
          console.log('[v0] Cleaning up wallet subscription')
          realtimeService.unsubscribe(channelId)
        }
      }
    })
  }, [])

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load wallet transactions to calculate balance
      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate balance from transactions
      const calculatedBalance = (transactions || []).reduce((sum, t) => {
        if (t.type === 'credit') return sum + parseFloat(t.amount)
        if (t.type === 'debit') return sum - parseFloat(t.amount)
        return sum
      }, 0)

      setBalance(calculatedBalance)
      setTransactions(transactions || [])
    } catch (error) {
      console.error('[v0] Error loading wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async () => {
    // Validar com Zod
    const validation = validateForm(walletTransactionSchema, {
      amount: parseFloat(amount) || 0,
      payment_method: 'pix'
    })

    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]
      iosToast.error(firstError)
      triggerHaptic('error')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create wallet transaction
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount: validation.data!.amount,
          type: 'credit',
          description: 'Recarga via PIX'
        })

      if (error) throw error

      await loadWalletData()
      setShowAddMoney(false)
      setAmount('')
      triggerHaptic('success')
      iosToast.success('Saldo adicionado')
    } catch (error) {
      console.error('[v0] Error adding money:', error)
      triggerHaptic('error')
      iosToast.error('Erro ao adicionar saldo')
    }
  }

  const getTransactionIcon = (type: string) => {
    if (type === 'credit' || type === 'refund') return '+'
    return '-'
  }

  const getTransactionColor = (type: string) => {
    if (type === 'credit' || type === 'refund') return 'text-green-600'
    return 'text-red-600'
  }

  const getTransactionBg = (type: string) => {
    if (type === 'credit' || type === 'refund') return 'bg-green-100'
    return 'bg-red-100'
  }

  if (loading) {
    return <WalletSkeleton />
  }

  return (
    <div className="h-dvh overflow-y-auto bg-gradient-to-b from-[#F2F2F7] via-[#FAFAFA] to-white dark:from-black dark:via-[#0A0A0A] dark:to-[#111111] pb-28 ios-scroll">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl animate-pulse-slow-delayed" />
      </div>

      {/* Header with blur */}
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
              <svg className="w-[20px] h-[20px] text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-[28px] font-bold text-foreground tracking-tight">Carteira</h1>
              <p className="text-[13px] text-muted-foreground">Gerencie seu saldo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-5 py-6 max-w-2xl mx-auto space-y-6">
        {/* Balance Card with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-[28px]" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-[13px] font-medium">Saldo Disponível</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h2 className="text-[44px] font-bold tracking-tight leading-none">R$ {balance.toFixed(2)}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  haptics.impactMedium()
                  setShowAddMoney(true)
                }}
                className="h-[56px] bg-white/20 backdrop-blur-md rounded-[18px] flex items-center justify-center gap-2.5 text-white font-semibold text-[17px] ios-press border border-white/10"
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.impactMedium()
                  iosToast.info('Em breve')
                }}
                className="h-[56px] bg-white/10 backdrop-blur-md rounded-[18px] flex items-center justify-center gap-2.5 text-white/90 font-semibold text-[17px] ios-press border border-white/10"
              >
                <CreditCard className="w-5 h-5" strokeWidth={2.5} />
                Sacar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[20px] p-5 border border-black/[0.04] dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-[12px] font-semibold text-muted-foreground">Recebido</span>
            </div>
            <p className="text-[24px] font-bold text-foreground">
              R$ {transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[20px] p-5 border border-black/[0.04] dark:border-white/[0.08] shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-[12px] font-semibold text-muted-foreground">Gasto</span>
            </div>
            <p className="text-[24px] font-bold text-foreground">
              R$ {transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
            </p>
          </div>
        </motion.div>

        {/* Transactions with animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[20px] font-bold text-foreground tracking-tight">Transações</h3>
            <button 
              type="button"
              onClick={() => {
                haptics.selection()
                iosToast.info('Filtros em breve')
              }}
              className="text-[15px] text-blue-500 font-semibold ios-press"
            >
              Filtrar
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[24px] p-12 text-center border border-black/[0.04] dark:border-white/[0.08]">
              <div className="w-20 h-20 rounded-full bg-secondary/40 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <p className="text-[17px] font-semibold text-foreground mb-2">Nenhuma transação</p>
              <p className="text-[15px] text-muted-foreground">Suas movimentações aparecerão aqui</p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[24px] overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-lg">
              <AnimatePresence>
                {transactions.map((transaction, i) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`px-5 py-4 flex items-center justify-between ios-press active:bg-secondary/20 transition-colors ${
                      i < transactions.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${
                        transaction.type === 'credit' || transaction.type === 'refund'
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
                          : 'bg-red-500/10 dark:bg-red-500/20'
                      }`}>
                        {transaction.type === 'credit' || transaction.type === 'refund' ? (
                          <ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-foreground truncate">
                          {transaction.description || 'Transação'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[13px] text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </p>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <p className="text-[13px] text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className={`text-[18px] font-bold tabular-nums ${
                        transaction.type === 'credit' || transaction.type === 'refund'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'credit' || transaction.type === 'refund' ? '+' : '-'}
                        R$ {Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                      </p>
                      <IOSChip 
                        variant={transaction.type === 'credit' || transaction.type === 'refund' ? 'success' : 'error'}
                        size="sm"
                      >
                        {transaction.type === 'credit' ? 'Crédito' : transaction.type === 'debit' ? 'Débito' : 'Reembolso'}
                      </IOSChip>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      {/* Bottom Sheet for adding money */}
      <IOSBottomSheet
        isOpen={showAddMoney}
        onClose={() => {
          setShowAddMoney(false)
          setAmount('')
        }}
        detent="medium"
      >
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">Adicionar Saldo</h2>
            <p className="text-[15px] text-muted-foreground">Escolha o valor para recarregar sua carteira</p>
          </div>

          <div className="space-y-4">
            <IOSInputEnhanced
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              prefix="R$"
              className="text-[32px] font-bold text-center"
            />

            <div>
              <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Valores Rápidos</p>
              <div className="grid grid-cols-3 gap-3">
                {[20, 50, 100, 200, 500, 1000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      haptics.impactLight()
                      setAmount(value.toString())
                    }}
                    className={`h-[56px] rounded-[16px] font-semibold text-[17px] ios-press transition-all ${
                      amount === value.toString()
                        ? 'bg-blue-500 text-white shadow-lg scale-95'
                        : 'bg-secondary/60 text-foreground'
                    }`}
                  >
                    R$ {value}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptics.impactMedium()
                handleAddMoney()
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full h-[56px] rounded-[18px] bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-[17px] ios-press shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              Confirmar Recarga
            </button>
          </div>
        </div>
      </IOSBottomSheet>

      <BottomNavigation />
    </div>
  )
}
