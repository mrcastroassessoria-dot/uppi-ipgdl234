'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/bottom-navigation'
import { iosToast } from '@/lib/utils/ios-toast'
import { haptics } from '@/lib/utils/ios-haptics'
import { couponApplySchema, validateForm } from '@/lib/validations/schemas'
import { EmptyState } from '@/components/empty-state'
import { IOSCard } from '@/components/ui/ios-card'
import { IOSBadge } from '@/components/ui/ios-badge'
import { IOSInputEnhanced } from '@/components/ui/ios-input-enhanced'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Ticket, Copy, Sparkles, Gift, Tag } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_amount: number
  max_discount: number
  valid_until: string
  used: boolean
}

export default function PromotionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const formattedCoupons = data?.map((item: any) => ({
        id: item.coupon.id,
        code: item.coupon.code,
        discount_type: item.coupon.discount_type,
        discount_value: item.coupon.discount_value,
        min_amount: item.coupon.min_amount,
        max_discount: item.coupon.max_discount,
        valid_until: item.coupon.valid_until,
        used: item.used
      })) || []

      setCoupons(formattedCoupons)
    } catch (error) {
      console.error('[v0] Error loading coupons:', error)
      iosToast.error('Erro ao carregar cupons')
    } finally {
      setLoading(false)
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim() || applying) return

    const validation = validateForm(couponApplySchema, { code: couponCode })
    if (!validation.success) {
      iosToast.error('Codigo invalido')
      return
    }

    setApplying(true)
    haptics.impactMedium()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single()

      if (couponError || !coupon) {
        haptics.notificationError()
        iosToast.error('Cupom invalido')
        return
      }

      const { data: existing } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', user.id)
        .eq('coupon_id', coupon.id)
        .single()

      if (existing) {
        haptics.notificationWarning()
        iosToast.error('Voce ja possui este cupom')
        return
      }

      const { error: insertError } = await supabase
        .from('user_coupons')
        .insert({
          user_id: user.id,
          coupon_id: coupon.id
        })

      if (insertError) throw insertError

      haptics.notificationSuccess()
      iosToast.success('Cupom adicionado')
      setCouponCode('')
      loadCoupons()
    } catch (error) {
      console.error('[v0] Error applying coupon:', error)
      haptics.notificationError()
      iosToast.error('Erro ao adicionar cupom')
    } finally {
      setApplying(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    haptics.notificationSuccess()
    iosToast.success('Codigo copiado')
  }

  if (loading) {
    return (
      <div className="h-dvh bg-gradient-to-b from-[#F2F2F7] to-white dark:from-black dark:to-[#111111] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-dvh overflow-y-auto bg-gradient-to-b from-[#F2F2F7] via-[#FAFAFA] to-white dark:from-black dark:via-[#0A0A0A] dark:to-[#111111] pb-28 ios-scroll">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow-delayed" />
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
              <h1 className="text-[28px] font-bold text-foreground tracking-tight">Promoções</h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">Economize em suas corridas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-5 py-6 max-w-2xl mx-auto space-y-6">
        {/* Add Coupon Card with gradient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-[24px]" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-[18px] bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Gift className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div className="text-white">
                <h2 className="text-[20px] font-bold">Adicionar Cupom</h2>
                <p className="text-[13px] text-emerald-100">Insira o código promocional</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <IOSInputEnhanced
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CODIGO"
                disabled={applying}
                className="flex-1 bg-white/90 dark:bg-white text-gray-900 font-mono font-bold uppercase placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => {
                  haptics.impactMedium()
                  applyCoupon()
                }}
                disabled={!couponCode.trim() || applying}
                className={`h-[56px] px-6 rounded-[16px] font-semibold text-[17px] ios-press transition-all ${
                  couponCode.trim() && !applying
                    ? 'bg-white text-emerald-600 shadow-2xl'
                    : 'bg-white/30 text-white/50'
                }`}
              >
                {applying ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Adicionar'
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Coupons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[20px] font-bold text-foreground tracking-tight">Meus Cupons</h2>
            <IOSBadge variant="default">
              {coupons.filter(c => !c.used && new Date(c.valid_until) >= new Date()).length} ativos
            </IOSBadge>
          </div>

          {coupons.length === 0 ? (
            <IOSCard variant="glass" className="p-12 text-center">
              <div className="w-20 h-20 rounded-[24px] bg-secondary/40 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-10 h-10 text-muted-foreground/40" strokeWidth={1.5} />
              </div>
              <p className="text-[17px] font-semibold text-foreground mb-2">Nenhum cupom disponível</p>
              <p className="text-[15px] text-muted-foreground">Adicione cupons para economizar</p>
            </IOSCard>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {coupons.map((coupon, index) => {
                  const isExpired = new Date(coupon.valid_until) < new Date()
                  const discount = coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}% OFF`
                    : `R$ ${coupon.discount_value.toFixed(2)} OFF`

                  return (
                    <motion.div
                      key={coupon.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative overflow-hidden ${coupon.used || isExpired ? 'opacity-60' : ''}`}
                    >
                      {/* Coupon ticket shape with dashed lines */}
                      <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[24px] border border-black/[0.04] dark:border-white/[0.08] shadow-lg overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                                <Tag className="w-7 h-7 text-white" strokeWidth={2} />
                              </div>
                              <div>
                                <div className="text-[32px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">{discount}</div>
                                <p className="text-[13px] text-muted-foreground mt-1">
                                  Mínimo R$ {coupon.min_amount.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <IOSBadge 
                              variant={
                                coupon.used ? 'default' :
                                isExpired ? 'error' :
                                'success'
                              }
                              size="sm"
                            >
                              {coupon.used ? 'Usado' : isExpired ? 'Expirado' : 'Disponível'}
                            </IOSBadge>
                          </div>

                          {/* Dashed divider */}
                          <div className="border-t-2 border-dashed border-black/[0.06] dark:border-white/[0.06] my-4" />

                          {/* Code section */}
                          <div className="flex items-center justify-between bg-secondary/50 p-4 rounded-[16px] border border-black/[0.04] dark:border-white/[0.04]">
                            <div className="flex-1">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Código</p>
                              <p className="font-mono font-bold text-[20px] text-foreground">{coupon.code}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                haptics.impactLight()
                                copyCode(coupon.code)
                              }}
                              disabled={coupon.used || isExpired}
                              className="flex items-center gap-2 h-[44px] px-5 rounded-[14px] bg-emerald-500 text-white text-[15px] font-semibold ios-press disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                              <Copy className="w-4 h-4" strokeWidth={2.5} />
                              Copiar
                            </button>
                          </div>

                          {/* Footer info */}
                          <div className="flex items-center justify-between mt-4 text-[13px]">
                            <span className="text-muted-foreground">
                              Válido até {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                            </span>
                            {coupon.max_discount > 0 && (
                              <span className="text-muted-foreground">
                                Máx. R$ {coupon.max_discount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Decorative circles on sides */}
                        <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#F2F2F7] dark:bg-black" />
                        <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#F2F2F7] dark:bg-black" />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  )
}
