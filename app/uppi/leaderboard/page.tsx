'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, TrendingUp, Star, Award } from 'lucide-react'
import { useHaptic } from '@/hooks/use-haptic'
import { iosToast } from '@/lib/utils/ios-toast'
import { EmptyState } from '@/components/empty-state'

interface LeaderboardEntry {
  id: string
  full_name: string
  avatar_url: string | null
  total_rides: number
  rating: number
  total_savings: number
  achievements_count: number
  rank: number
}

type Category = 'total_rides' | 'savings' | 'rating' | 'achievements'

export default function LeaderboardPage() {
  const [category, setCategory] = useState<Category>('total_rides')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const haptic = useHaptic()

  useEffect(() => {
    fetchLeaderboard()
  }, [category])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/leaderboard?category=${category}&limit=100`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
      setUserRank(data.userRank || null)
    } catch (error) {
      console.error('[v0] Error fetching leaderboard:', error)
      iosToast.error('Erro ao carregar ranking')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: 'total_rides' as Category, label: 'Corridas', icon: Trophy },
    { id: 'savings' as Category, label: 'Economia', icon: TrendingUp },
    { id: 'rating' as Category, label: 'Avaliação', icon: Star },
    { id: 'achievements' as Category, label: 'Conquistas', icon: Award },
  ]

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-amber-500'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-orange-400 to-orange-600'
    return 'from-blue-500 to-blue-600'
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="pt-safe-offset-12 pb-3 px-4 border-b border-border/50 bg-card/50 ios-blur">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => router.back()} className="ios-press">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-[20px] font-bold text-foreground">Ranking</h1>
          <div className="w-6" />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto ios-scroll-x -mx-4 px-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  haptic.selection()
                  setCategory(cat.id)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[15px] font-semibold whitespace-nowrap ios-press ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <div className="px-4 py-3 bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankBadgeColor(userRank.rank)} flex items-center justify-center text-white font-bold text-[16px] shadow-lg`}
              >
                {getRankEmoji(userRank.rank)}
              </div>
              <div>
                <p className="text-white font-bold text-[17px]">Sua Posição</p>
                <p className="text-white/80 text-[13px]">
                  {category === 'total_rides' && `${userRank.total_rides} corridas`}
                  {category === 'savings' && `R$ ${userRank.total_savings.toFixed(2)} economizados`}
                  {category === 'rating' && `${userRank.rating.toFixed(1)} ⭐`}
                  {category === 'achievements' && `${userRank.achievements_count} conquistas`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-[28px] font-bold leading-none">{userRank.rank}º</p>
              <p className="text-white/70 text-[12px]">lugar</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto ios-scroll px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <EmptyState 
            icon={<Trophy className="w-10 h-10" />}
            title="Ranking vazio"
            description="Complete corridas para aparecer no ranking"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map((entry, index) => {
              const isUser = entry.id === userRank?.id
              const isTopThree = entry.rank <= 3

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl ios-smooth ${
                    isUser
                      ? 'bg-primary/10 border-2 border-primary/30'
                      : isTopThree
                        ? 'bg-gradient-to-r from-card to-secondary border border-border/50'
                        : 'bg-card border border-border/50'
                  }`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] ${
                      isTopThree
                        ? `bg-gradient-to-br ${getRankBadgeColor(entry.rank)} text-white shadow-lg`
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {getRankEmoji(entry.rank)}
                  </div>

                  {/* Avatar */}
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url || "/placeholder.svg"}
                      alt={entry.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-background"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold border-2 border-background">
                      {entry.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-foreground truncate">
                      {entry.full_name}
                      {isUser && (
                        <span className="ml-2 text-[12px] font-bold text-primary">(Você)</span>
                      )}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {category === 'total_rides' && `${entry.total_rides} corridas`}
                      {category === 'savings' && `R$ ${entry.total_savings.toFixed(2)} economizados`}
                      {category === 'rating' && `${entry.rating.toFixed(1)} ⭐ • ${entry.total_rides} corridas`}
                      {category === 'achievements' && `${entry.achievements_count} conquistas`}
                    </p>
                  </div>

                  {/* Stats Badge */}
                  {isTopThree && (
                    <div className="text-right">
                      <p className="text-[18px] font-bold text-foreground">
                        {category === 'total_rides' && entry.total_rides}
                        {category === 'savings' && `R$ ${entry.total_savings.toFixed(0)}`}
                        {category === 'rating' && entry.rating.toFixed(1)}
                        {category === 'achievements' && entry.achievements_count}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
