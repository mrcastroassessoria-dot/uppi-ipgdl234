'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/bottom-navigation'
import { iosToast } from '@/lib/utils/ios-toast'
import { EmptyState } from '@/components/empty-state'

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/onboarding/splash')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, driver_profile:driver_profiles(*)')
        .eq('id', user.id)
        .single()

      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

      const { data: rides } = await supabase
        .from('rides')
        .select('*, price_offers!inner(*)')
        .or(`passenger_id.eq.${user.id},driver_id.eq.${user.id}`)
        .eq('status', 'completed')
        .gte('created_at', oneYearAgo.toISOString())
        .order('created_at', { ascending: false })

      const monthly = calculateMonthlyStats(rides || [], user.id, profile?.user_type)

      setStats({
        totalRides: rides?.length || 0,
        totalSpent: calculateTotal(rides || [], user.id, 'passenger'),
        totalEarned: calculateTotal(rides || [], user.id, 'driver'),
        avgRating: profile?.rating || 0,
        userType: profile?.user_type
      })
      
      setMonthlyData(monthly)
    } catch (error) {
      console.error('[v0] Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (rides: any[], userId: string, type: 'passenger' | 'driver') => {
    return rides
      .filter(ride => type === 'passenger' ? ride.passenger_id === userId : ride.driver_id === userId)
      .reduce((sum, ride) => sum + (ride.price_offers?.[0]?.amount || 0), 0)
  }

  const calculateMonthlyStats = (rides: any[], userId: string, userType: string) => {
    const monthsData: any = {}
    
    rides.forEach(ride => {
      const date = new Date(ride.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = { month: monthKey, rides: 0, amount: 0 }
      }
      
      monthsData[monthKey].rides++
      monthsData[monthKey].amount += ride.price_offers?.[0]?.amount || 0
    })

    return Object.values(monthsData).slice(0, 6).reverse()
  }

  if (loading) {
    return (
      <div className="h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-[2.5px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const maxAmount = Math.max(...monthlyData.map((d: any) => d.amount), 1)

  return (
    <div className="h-dvh overflow-y-auto bg-background pb-24 ios-scroll">
      {/* Header - iOS style */}
      <header className="bg-card/95 ios-blur border-b border-border/40 sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full ios-press">
              <svg className="w-[22px] h-[22px] text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Analytics</h1>
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto space-y-5 animate-ios-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center mb-3">
              <svg className="w-[22px] h-[22px] text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <p className="text-[28px] font-bold text-foreground tracking-tight">{stats?.totalRides}</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Corridas</p>
          </div>
          <div className="bg-card rounded-[18px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="w-10 h-10 bg-amber-50 rounded-[12px] flex items-center justify-center mb-3">
              <svg className="w-[22px] h-[22px] text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <p className="text-[28px] font-bold text-foreground tracking-tight">{stats?.avgRating.toFixed(1)}</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Avaliacao</p>
          </div>
          {stats?.userType === 'passenger' && (
            <div className="col-span-2 bg-blue-500 rounded-[18px] p-5 shadow-[0_4px_16px_rgba(59,130,246,0.3)]">
              <p className="text-[13px] font-medium text-blue-100 mb-1">Total Gasto</p>
              <p className="text-[32px] font-bold text-white tracking-tight">
                R$ {stats?.totalSpent.toFixed(2)}
              </p>
            </div>
          )}
          {stats?.userType === 'driver' && (
            <div className="col-span-2 bg-green-500 rounded-[18px] p-5 shadow-[0_4px_16px_rgba(34,197,94,0.3)]">
              <p className="text-[13px] font-medium text-green-100 mb-1">Total Ganho</p>
              <p className="text-[32px] font-bold text-white tracking-tight">
                R$ {stats?.totalEarned.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Monthly Chart */}
        <div>
          <p className="ios-section-header">Ultimos 6 Meses</p>
          <div className="bg-card rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {monthlyData.length > 0 ? (
              <div className="space-y-3">
                {monthlyData.map((data: any) => (
                  <div key={data.month}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-muted-foreground">{data.month}</span>
                      <span className="text-[13px] font-bold text-foreground">R$ {data.amount.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full ios-smooth"
                        style={{ width: `${Math.max((data.amount / maxAmount) * 100, 4)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{data.rides} corridas</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-secondary rounded-[18px] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <p className="text-[15px] font-medium text-foreground">Nenhuma corrida ainda</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">Seus dados aparecerao aqui</p>
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        <div>
          <p className="ios-section-header">Insights</p>
          <div className="space-y-2.5 stagger-children">
            <div className="bg-card rounded-[18px] p-4 flex items-start gap-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="w-11 h-11 bg-blue-50 rounded-[14px] flex items-center justify-center flex-shrink-0">
                <svg className="w-[22px] h-[22px] text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground">Crescimento</p>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">Voce esta usando o Uppi cada vez mais!</p>
              </div>
            </div>
            <div className="bg-card rounded-[18px] p-4 flex items-start gap-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="w-11 h-11 bg-green-50 rounded-[14px] flex items-center justify-center flex-shrink-0">
                <svg className="w-[22px] h-[22px] text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground">Economia</p>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">Negociar precos te fez economizar em media 15%</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
