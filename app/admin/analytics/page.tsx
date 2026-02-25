import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsDashboardClient } from './client'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/uppi/home')
  }

  // Fetch all analytics data
  const [platformMetrics, revenueAnalytics, cohortAnalysis, driverPerformance, growthMetrics] = await Promise.all([
    supabase.rpc('get_platform_metrics', { time_range: '24 hours' }),
    supabase.rpc('get_revenue_analytics'),
    supabase.rpc('get_cohort_analysis'),
    supabase.rpc('get_driver_performance', { days: 30 }),
    supabase.rpc('get_growth_metrics'),
  ])

  return (
    <AnalyticsDashboardClient
      platformMetrics={platformMetrics.data}
      revenueAnalytics={revenueAnalytics.data}
      cohortAnalysis={cohortAnalysis.data || []}
      driverPerformance={driverPerformance.data || []}
      growthMetrics={growthMetrics.data}
    />
  )
}
