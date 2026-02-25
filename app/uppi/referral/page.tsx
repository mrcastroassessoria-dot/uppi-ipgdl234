import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BottomNavigation } from '@/components/bottom-navigation'
import { ReferralClient } from '@/components/referral-client'

export const dynamic = 'force-dynamic'

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/onboarding/splash')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get referral code from profile
  const referralCode = profile?.referral_code || user.id.substring(0, 8).toUpperCase()

  // Count completed referrals
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, referred:profiles!referred_id(full_name, avatar_url, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const totalReferrals = referrals?.length || 0
  const completedReferrals = referrals?.filter(r => r.first_ride_completed).length || 0
  const pendingReferrals = totalReferrals - completedReferrals
  const referralBonus = profile?.referral_credits || 0
  const referralCredits = profile?.referral_credits || 0

  // Get achievements
  const { data: achievements } = await supabase
    .from('referral_achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })

  return (
    <div className="h-dvh overflow-y-auto bg-background pb-24 ios-scroll">
      {/* Header - iOS style */}
      <header className="bg-card/95 ios-blur border-b border-border sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center gap-4">
            <Link href="/uppi/home">
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full ios-press"
              >
                <svg className="w-[22px] h-[22px] text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Link>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Indique & Ganhe</h1>
          </div>
        </div>
      </header>

      <main className="px-5 pt-6">
        <ReferralClient
          referralCode={referralCode}
          totalReferrals={totalReferrals}
          completedReferrals={completedReferrals}
          pendingReferrals={pendingReferrals}
          referralCredits={referralCredits}
          referrals={referrals || []}
          achievements={achievements || []}
        />
      </main>

      <BottomNavigation />
    </div>
  )
}
