'use client'

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AvatarFallback } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star, ArrowLeft, Check } from 'lucide-react'
import { useHaptic } from '@/hooks/use-haptic'
import { iosToast } from '@/lib/utils/ios-toast'
import type { Ride, Profile } from '@/lib/types/database'
import { reviewService } from '@/lib/services/review-service'

const PASSENGER_TAGS = [
  { id: 'educado', label: 'Educado', icon: '😊' },
  { id: 'pontual', label: 'Pontual', icon: '⏰' },
  { id: 'respeitoso', label: 'Respeitoso', icon: '🤝' },
  { id: 'conversou_bem', label: 'Boa conversa', icon: '💬' },
  { id: 'silencioso', label: 'Silencioso', icon: '🤫' },
  { id: 'limpeza', label: 'Limpo', icon: '✨' },
]

const DRIVER_TAGS = [
  { id: 'pontual', label: 'Pontual', icon: '⏰' },
  { id: 'educado', label: 'Educado', icon: '😊' },
  { id: 'carro_limpo', label: 'Carro limpo', icon: '✨' },
  { id: 'direcao_segura', label: 'Direção segura', icon: '🛡️' },
  { id: 'musica_boa', label: 'Música boa', icon: '🎵' },
  { id: 'ar_condicionado', label: 'Ar condicionado', icon: '❄️' },
]

const RATING_TAGS = ['educado', 'pontual', 'respeitoso', 'conversou_bem', 'silencioso', 'limpeza', 'carro_limpo', 'direcao_segura', 'musica_boa', 'ar_condicionado'];

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const haptic = useHaptic()
  
  const [ride, setRide] = useState<Ride | null>(null)
  const [reviewedUser, setReviewedUser] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reviewType, setReviewType] = useState<'passenger_to_driver' | 'driver_to_passenger'>('passenger_to_driver')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/onboarding/splash')
        return
      }

      // Load current user profile
      const { data: currentUserData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setCurrentUser(currentUserData)

      // Load ride
      const { data: rideData } = await supabase
        .from('rides')
        .select('*')
        .eq('id', params.id)
        .single()
      
      setRide(rideData)

      // Determine who to review and review type
      const isDriver = rideData?.driver_id === user.id
      const reviewedUserId = isDriver ? rideData?.passenger_id : rideData?.driver_id
      
      setReviewType(isDriver ? 'driver_to_passenger' : 'passenger_to_driver')

      if (reviewedUserId) {
        const { data: reviewedUserData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', reviewedUserId)
          .single()
        
        setReviewedUser(reviewedUserData)
      }

      // Check if already reviewed using new driver_reviews table
      const { data: existingReview } = await supabase
        .from('driver_reviews')
        .select('*')
        .eq('ride_id', params.id)
        .single()

      if (existingReview) {
        // Check if this specific user already reviewed
        if (isDriver && existingReview.driver_reviewed_at) {
          router.push('/uppi/history')
          return
        }
        if (!isDriver && existingReview.passenger_reviewed_at) {
          router.push('/uppi/history')
          return
        }
      }

      setLoading(false)
    }

    loadData()
  }, [params.id, supabase, router])

  const handleSubmit = async () => {
    if (rating === 0) {
      iosToast.warning('Selecione uma avaliação', 'Toque nas estrelas para avaliar')
      return
    }

    if (!currentUser || !reviewedUser || !ride) return

    try {
      setSubmitting(true)
      haptic.medium()

      const result = await reviewService.submitReview({
        ride_id: params.id as string,
        reviewer_id: currentUser.id,
        reviewee_id: reviewedUser.id,
        rating,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      })

      if (!result.success) {
        iosToast.error('Erro ao enviar avaliação', result.error || 'Tente novamente')
        return
      }

      haptic.success()
      iosToast.success('Avaliação enviada!', 'Obrigado pelo feedback')

      setTimeout(() => {
        router.push('/uppi/history')
      }, 1500)
    } catch (error) {
      console.error('[v0] Error submitting review:', error)
      haptic.error()
      iosToast.error('Erro ao enviar', 'Tente novamente')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTag = (tagId: string) => {
    haptic.selection()
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }

  const handleStarClick = (value: number) => {
    haptic.selection()
    setRating(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isDriver = ride?.driver_id === currentUser?.id
  const tags = isDriver ? PASSENGER_TAGS : DRIVER_TAGS

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="ios-header-blur sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            type="button"
            onClick={() => router.back()}
            className="ios-press"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold">Avaliar Corrida</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Avatar e Nome */}
        <div className="flex flex-col items-center gap-4 pt-4 animate-ios-fade-up">
          <div className="relative">
            <img
              src={reviewedUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=person'}
              alt={reviewedUser?.full_name || 'User'}
              className="w-24 h-24 rounded-full border-2 border-border"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">{reviewedUser?.full_name}</h2>
            <p className="text-sm text-muted-foreground">
              {isDriver ? 'Passageiro' : 'Motorista'}
            </p>
          </div>
        </div>

        {/* Stars Rating */}
        <div className="animate-ios-fade-up" style={{ animationDelay: '100ms' }}>
          <p className="text-center text-sm text-muted-foreground mb-3">
            Como foi sua experiência?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStarClick(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="ios-press transition-transform"
              >
                <Star
                  className={`w-10 h-10 transition-all ${
                    value <= (hoveredRating || rating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm font-semibold text-foreground mt-2">
              {rating === 5 && 'Excelente! ⭐'}
              {rating === 4 && 'Muito bom! 👍'}
              {rating === 3 && 'Bom 👌'}
              {rating === 2 && 'Poderia melhorar 😐'}
              {rating === 1 && 'Ruim 😞'}
            </p>
          )}
        </div>

        {/* Tags */}
        {rating > 0 && (
          <div className="animate-ios-fade-up" style={{ animationDelay: '200ms' }}>
            <p className="text-sm font-semibold text-foreground mb-3">
              O que você destacaria? (Opcional)
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ios-press ${
                    selectedTags.includes(tag.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <span className="mr-1">{tag.icon}</span>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comentário */}
        {rating > 0 && (
          <div className="animate-ios-fade-up" style={{ animationDelay: '300ms' }}>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Comentário (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/500
            </p>
          </div>
        )}

        {/* Submit Button */}
        {rating > 0 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 bg-blue-500 text-white rounded-xl font-bold text-[17px] flex items-center justify-center gap-2 ios-press disabled:opacity-50 animate-ios-fade-up"
            style={{ animationDelay: '400ms' }}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Enviar Avaliação
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
