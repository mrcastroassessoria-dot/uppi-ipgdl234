'use client'

import { useState } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign, Car, Star, Clock, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  platformMetrics: any
  revenueAnalytics: any
  cohortAnalysis: any[]
  driverPerformance: any[]
  growthMetrics: any
}

export function AnalyticsDashboardClient({
  platformMetrics,
  revenueAnalytics,
  cohortAnalysis,
  driverPerformance,
  growthMetrics,
}: Props) {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('24h')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/[0.92] ios-blur border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full ios-press"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
            </button>
            <h1 className="text-[17px] font-bold text-foreground">Analytics</h1>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-[13px] font-semibold transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            icon={Car}
            label="Corridas"
            value={formatNumber(platformMetrics?.total_rides || 0)}
            change="+12%"
            trend="up"
            color="blue"
          />
          <KPICard
            icon={DollarSign}
            label="Receita"
            value={formatCurrency(platformMetrics?.total_revenue || 0)}
            change="+8%"
            trend="up"
            color="emerald"
          />
          <KPICard
            icon={Users}
            label="Usuários Ativos"
            value={formatNumber(platformMetrics?.active_riders || 0)}
            change="+23%"
            trend="up"
            color="purple"
          />
          <KPICard
            icon={Star}
            label="Avaliação Média"
            value={platformMetrics?.avg_rating?.toFixed(1) || '0.0'}
            change="+0.2"
            trend="up"
            color="amber"
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-card rounded-3xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-foreground">Receita por Dia</h2>
            <div className="text-[13px] text-muted-foreground">Últimos 30 dias</div>
          </div>
          
          <div className="space-y-2">
            {revenueAnalytics?.revenue_by_day?.slice(0, 7).map((day: any, idx: number) => {
              const maxRevenue = Math.max(...revenueAnalytics.revenue_by_day.map((d: any) => d.revenue))
              const percentage = (day.revenue / maxRevenue) * 100
              
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-16 text-[11px] text-muted-foreground font-medium">
                    {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="flex-1">
                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-end px-2"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-[11px] font-bold text-white">
                          {formatCurrency(day.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-muted-foreground font-medium">Taxa de Conclusão</span>
              <Zap className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {platformMetrics?.completion_rate || 0}%
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {formatNumber(platformMetrics?.completed_rides || 0)} completadas
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-muted-foreground font-medium">Valor Médio</span>
              <DollarSign className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(platformMetrics?.avg_ride_price || 0)}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              por corrida
            </div>
          </div>
        </div>

        {/* Top Drivers */}
        <div className="bg-card rounded-3xl border border-border p-5">
          <h2 className="text-[15px] font-bold text-foreground mb-4">Top Motoristas</h2>
          
          <div className="space-y-3">
            {driverPerformance.slice(0, 5).map((driver: any, idx: number) => (
              <div key={driver.driver_id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${
                  idx === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                  idx === 1 ? 'bg-gray-400/20 text-gray-600 dark:text-gray-400' :
                  idx === 2 ? 'bg-orange-600/20 text-orange-700 dark:text-orange-400' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  #{idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {driver.driver_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatNumber(driver.total_rides)} corridas • ⭐ {driver.avg_rating?.toFixed(1)}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-[13px] font-bold text-foreground">
                    {formatCurrency(driver.total_earnings)}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {driver.completion_rate}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Metrics */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-5 border border-blue-500/20">
          <h2 className="text-[15px] font-bold text-foreground mb-4">Crescimento</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Hoje</p>
              <p className="text-xl font-bold text-foreground">
                {formatNumber(growthMetrics?.new_users_today || 0)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Esta Semana</p>
              <p className="text-xl font-bold text-foreground">
                {formatNumber(growthMetrics?.new_users_this_week || 0)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Este Mês</p>
              <p className="text-xl font-bold text-foreground">
                {formatNumber(growthMetrics?.new_users_this_month || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Cohort Table */}
        {cohortAnalysis.length > 0 && (
          <div className="bg-card rounded-3xl border border-border p-5">
            <h2 className="text-[15px] font-bold text-foreground mb-4">Análise de Cohort (Retenção %)</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Cohort</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Usuários</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">M0</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">M1</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">M2</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">M3</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortAnalysis.slice(0, 6).map((cohort: any) => (
                    <tr key={cohort.cohort_month} className="border-b border-border/50">
                      <td className="py-2 px-2 font-medium text-foreground">{cohort.cohort_month}</td>
                      <td className="text-right py-2 px-2 text-foreground">{cohort.users_count}</td>
                      <td className="text-right py-2 px-2">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded font-semibold">
                          {cohort.month_0}%
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded font-semibold">
                          {cohort.month_1}%
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded font-semibold">
                          {cohort.month_2}%
                        </span>
                      </td>
                      <td className="text-right py-2 px-2">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded font-semibold">
                          {cohort.month_3}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({ icon: Icon, label, value, change, trend, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-500',
    emerald: 'bg-emerald-500/20 text-emerald-500',
    purple: 'bg-purple-500/20 text-purple-500',
    amber: 'bg-amber-500/20 text-amber-500',
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-bold ${
          trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div className="text-xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
    </div>
  )
}
