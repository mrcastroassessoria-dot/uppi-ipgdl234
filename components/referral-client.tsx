'use client'

import { ReferralCard } from '@/components/referral-card'
import { Car, Gift, Sparkles, Share2 } from 'lucide-react'
import { useState } from 'react'

interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  first_ride_completed: boolean
  bonus_paid: boolean
  bonus_amount: number
  created_at: string
  completed_at?: string
  referred?: {
    full_name: string
    avatar_url?: string
    created_at: string
  }
}

interface Achievement {
  id: string
  user_id: string
  achievement_type: string
  achievement_name: string
  description: string
  icon: string
  unlocked_at: string
}

interface ReferralClientProps {
  referralCode: string
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  referralCredits: number
  referrals: Referral[]
  achievements: Achievement[]
}

export function ReferralClient({ 
  referralCode, 
  totalReferrals, 
  completedReferrals,
  pendingReferrals,
  referralCredits,
  referrals,
  achievements 
}: ReferralClientProps) {
  const [showAchievements, setShowAchievements] = useState(false)
  const referralSteps = [
    {
      icon: <Share2 className="h-4 w-4" strokeWidth={2.5} />,
      text: 'Compartilhe seu código de indicação',
    },
    {
      icon: <Gift className="h-4 w-4" strokeWidth={2.5} />,
      text: (
        <>
          Seu amigo ganha <span className="font-bold text-foreground">R$ 10 em créditos</span> na primeira corrida
        </>
      ),
    },
    {
      icon: <Sparkles className="h-4 w-4" strokeWidth={2.5} />,
      text: (
        <>
          Você recebe <span className="font-bold text-foreground">R$ 10 em créditos</span> por cada indicação
        </>
      ),
    },
  ]

  const referralLink = `https://uppi.app/convite/${referralCode}`
  const referralBonus = referralCredits; // Declare the referralBonus variable

  return (
    <>
      <ReferralCard
        badgeText="Ganhe R$ 10+ em créditos"
        title="Indique & Ganhe"
        description="para cada amigo que você convidar"
        steps={referralSteps}
        referralLink={referralLink}
      />

      {/* Stats Section - Enhanced */}
      <div className="mt-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[20px] p-6 shadow-lg shadow-blue-500/20">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-bold text-white">Suas Conquistas</h3>
          {achievements.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAchievements(!showAchievements)}
              className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full ios-press"
            >
              <span className="text-[12px] font-bold text-white">{achievements.length} 🏆</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-[14px] p-3.5 text-center">
            <div className="text-[28px] font-bold text-white tracking-tight tabular-nums">{totalReferrals}</div>
            <div className="text-[11px] text-white/80 font-medium mt-1">Total</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-[14px] p-3.5 text-center">
            <div className="text-[28px] font-bold text-emerald-300 tracking-tight tabular-nums">{completedReferrals}</div>
            <div className="text-[11px] text-white/80 font-medium mt-1">Completos</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-[14px] p-3.5 text-center">
            <div className="text-[28px] font-bold text-yellow-300 tracking-tight tabular-nums">{pendingReferrals}</div>
            <div className="text-[11px] text-white/80 font-medium mt-1">Pendentes</div>
          </div>
        </div>
        
        {/* Credits earned */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-[14px] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-white/70 font-medium uppercase tracking-wider">Créditos Ganhos</p>
              <p className="text-[20px] font-bold text-white tracking-tight">R$ {referralCredits.toFixed(2)}</p>
            </div>
          </div>
          <svg className="w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>

      {/* Achievements Display */}
      {showAchievements && achievements.length > 0 && (
        <div className="mt-4 bg-card rounded-[20px] p-5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <h3 className="text-[15px] font-bold text-foreground mb-3">Conquistas Desbloqueadas</h3>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-secondary rounded-[12px]">
                <div className="text-[32px]">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-foreground">{achievement.achievement_name}</p>
                  <p className="text-[12px] text-muted-foreground">{achievement.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress to next achievement */}
      {totalReferrals < 50 && (
        <div className="mt-4 bg-card rounded-[20px] p-5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-muted-foreground">Próxima conquista</p>
            <p className="text-[12px] font-bold text-purple-500">
              {totalReferrals < 5 ? '5 indicações' : totalReferrals < 10 ? '10 indicações' : totalReferrals < 25 ? '25 indicações' : '50 indicações'}
            </p>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
              style={{ 
                width: `${totalReferrals < 5 ? (totalReferrals / 5) * 100 : totalReferrals < 10 ? (totalReferrals / 10) * 100 : totalReferrals < 25 ? (totalReferrals / 25) * 100 : (totalReferrals / 50) * 100}%` 
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {totalReferrals < 5 ? `Faltam ${5 - totalReferrals} indicações` : 
             totalReferrals < 10 ? `Faltam ${10 - totalReferrals} indicações` : 
             totalReferrals < 25 ? `Faltam ${25 - totalReferrals} indicações` : 
             `Faltam ${50 - totalReferrals} indicações`}
          </p>
        </div>
      )}

      {/* Referrals List */}
      {referrals.length > 0 && (
        <div className="mt-4 bg-card rounded-[20px] p-5 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <h3 className="text-[15px] font-bold text-foreground mb-3">Seus Amigos</h3>
          <div className="space-y-2">
            {referrals.slice(0, 5).map((referral) => (
              <div key={referral.id} className="flex items-center gap-3 p-2.5 bg-secondary rounded-[10px]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  {referral.referred?.avatar_url ? (
                    <img src={referral.referred.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-[14px] font-bold text-white">
                      {referral.referred?.full_name?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">
                    {referral.referred?.full_name || 'Amigo'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {referral.first_ride_completed ? '✅ Primeira corrida completa' : '⏳ Aguardando primeira corrida'}
                  </p>
                </div>
                {referral.first_ride_completed && (
                  <div className="text-[12px] font-bold text-emerald-500">+R$ {referral.bonus_amount.toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
          {referrals.length > 5 && (
            <button type="button" className="w-full mt-3 text-[13px] font-semibold text-purple-500">
              Ver todos ({referrals.length})
            </button>
          )}
        </div>
      )}

      {/* Share Section */}
      <div className="mt-6 bg-card rounded-[20px] p-6 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <h3 className="text-[17px] font-bold text-foreground mb-4">Compartilhar</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="h-[52px] rounded-[14px] bg-[#25D366] text-white font-semibold text-[15px] ios-press flex items-center justify-center gap-2"
            onClick={() => {
              const text = `Use o código ${referralCode} no app Uppi e ganhe R$ 10 na primeira corrida! 🚗`
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>

          <button
            type="button"
            className="h-[52px] rounded-[14px] bg-secondary text-foreground font-semibold text-[15px] ios-press flex items-center justify-center gap-2 border border-border"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Indique Uppi',
                  text: `Use o código ${referralCode} no app Uppi e ganhe R$ 10 na primeira corrida! 🚗`,
                  url: referralLink
                })
              } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(`Use o código ${referralCode} no app Uppi e ganhe R$ 10 na primeira corrida! 🚗 ${referralLink}`)
                alert('Link copiado!')
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartilhar
          </button>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-6 px-4 pb-4">
        <p className="text-[13px] text-muted-foreground text-center leading-relaxed">
          Os créditos são adicionados automaticamente após a primeira corrida do seu amigo. Termos e condições aplicam-se.
        </p>
      </div>
    </>
  )
}
