'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/admin-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell } from 'recharts'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Banknote, Wallet, ArrowUpRight, ArrowDownRight, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  ride_id: string
  amount: number
  status: string
  payment_method: string
  created_at: string
}

export default function FinanceiroPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [dailyRevenue, setDailyRevenue] = useState<{ day: string; revenue: number; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(500)
    if (data) setPayments(data)

    // Build daily revenue for last 14 days
    const days: { day: string; revenue: number; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const start = new Date(d); start.setHours(0, 0, 0, 0)
      const end = new Date(d); end.setHours(23, 59, 59, 999)
      const { data: dayPay } = await supabase.from('payments').select('amount')
        .gte('created_at', start.toISOString()).lte('created_at', end.toISOString()).eq('status', 'completed')
      const revenue = dayPay?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0
      days.push({
        day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue,
        count: dayPay?.length || 0,
      })
    }
    setDailyRevenue(days)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const supabase = createClient()
    const channel = supabase
      .channel('admin-payments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, () => fetchData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  // Calculations
  const completed = payments.filter(p => p.status === 'completed')
  const totalRevenue = completed.reduce((s, p) => s + Number(p.amount || 0), 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayPayments = completed.filter(p => new Date(p.created_at) >= today)
  const todayRevenue = todayPayments.reduce((s, p) => s + Number(p.amount || 0), 0)

  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayEnd = new Date(today)
  const yesterdayPayments = completed.filter(p => {
    const d = new Date(p.created_at)
    return d >= yesterday && d < yesterdayEnd
  })
  const yesterdayRevenue = yesterdayPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

  const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0

  // Payment method breakdown
  const methodCounts: Record<string, number> = {}
  for (const p of completed) {
    const m = p.payment_method || 'other'
    methodCounts[m] = (methodCounts[m] || 0) + Number(p.amount || 0)
  }
  const methodColors: Record<string, string> = { pix: '#10b981', cash: '#f59e0b', credit_card: '#3b82f6', debit_card: '#8b5cf6', other: '#6b7280' }
  const methodLabels: Record<string, string> = { pix: 'PIX', cash: 'Dinheiro', credit_card: 'Credito', debit_card: 'Debito', other: 'Outro' }
  const pieData = Object.entries(methodCounts).map(([key, value]) => ({
    name: methodLabels[key] || key,
    value,
    color: methodColors[key] || '#6b7280',
  }))

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  for (const p of payments) statusCounts[p.status] = (statusCounts[p.status] || 0) + 1

  if (loading) {
    return (
      <>
        <AdminHeader title="Financeiro" subtitle="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Financeiro" subtitle="Receitas e pagamentos" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-[24px] font-bold text-foreground tracking-tight tabular-nums">R$ {totalRevenue.toFixed(2)}</p>
              <p className="text-[12px] text-muted-foreground font-medium">Receita Total</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                {revenueChange !== 0 && (
                  <div className={cn('flex items-center gap-0.5 text-[11px] font-bold', revenueChange > 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {revenueChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(revenueChange).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-[24px] font-bold text-foreground tracking-tight tabular-nums">R$ {todayRevenue.toFixed(2)}</p>
              <p className="text-[12px] text-muted-foreground font-medium">Receita Hoje</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-violet-500" />
                </div>
              </div>
              <p className="text-[24px] font-bold text-foreground tracking-tight tabular-nums">R$ {avgTicket.toFixed(2)}</p>
              <p className="text-[12px] text-muted-foreground font-medium">Ticket Medio</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-cyan-500" />
                </div>
              </div>
              <p className="text-[24px] font-bold text-foreground tracking-tight tabular-nums">{completed.length}</p>
              <p className="text-[12px] text-muted-foreground font-medium">Pagamentos</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <Card className="border-border/50 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-bold">Receita - Ultimos 14 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ revenue: { label: 'Receita', color: '#10b981' } }}
                className="h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Payment Methods Pie */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-bold">Metodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieData.map((p) => (
                      <div key={p.name} className="flex items-center gap-2 text-[12px]">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
                        <span className="text-foreground font-medium flex-1">{p.name}</span>
                        <span className="text-muted-foreground tabular-nums">R$ {p.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-[13px]">
                  Sem dados
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Payments Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-bold">Pagamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">ID Corrida</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Metodo</th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-semibold">Status</th>
                    <th className="text-right px-4 py-2.5 text-muted-foreground font-semibold">Valor</th>
                    <th className="text-right px-4 py-2.5 text-muted-foreground font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 20).map((p) => {
                    const methodIcon = p.payment_method === 'pix' ? Banknote : p.payment_method === 'cash' ? Banknote : CreditCard
                    const MIcon = methodIcon
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">{p.ride_id?.slice(0, 8) || '---'}...</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-foreground">
                            <MIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            {methodLabels[p.payment_method] || p.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn('text-[10px] font-bold',
                            p.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' :
                            p.status === 'pending' ? 'bg-amber-500/15 text-amber-500' :
                            'bg-red-500/15 text-red-500'
                          )}>
                            {p.status === 'completed' ? 'Pago' : p.status === 'pending' ? 'Pendente' : p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-foreground font-semibold tabular-nums">R$ {Number(p.amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                          {new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum pagamento encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
