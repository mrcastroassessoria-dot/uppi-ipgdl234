'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Star } from 'lucide-react'
import { useHaptic } from '@/hooks/use-haptic'
import { iosToast } from '@/lib/utils/ios-toast'
import type { Ride, Profile } from '@/lib/types/database'

interface Category {
  key: string
  name: string
  icon: string
}

const POSITIVE_TAGS = [
  'Pontual', 'Educado', 'Dirigiu bem', 'Carro limpo', 'Boa conversa', 
  'Respeitoso', 'Trajeto ótimo', 'Profissional', 'Simpático'
]

const NEGATIVE_TAGS = [
  'Atrasado', 'Grosseiro', 'Dirigiu mal', 'Carro sujo', 
  'Impaciente', 'Trajeto ruim', 'Cancelou'
]

export default function EnhancedReviewPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { trigger } = useHaptic()
  
  const [ride, setRide] = useState<Ride | null>(null)
  const [reviewedUser, setReviewedUser] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [rating, setRating] = useState(0)
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/onboarding/splash')
        return
      }

      const { data: currentUserData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setCurrentUser(currentUserData)

      const { data: rideData } = await supabase
        .from('rides')
        .select('*')
        .eq('id', params.id)
        .single()
      
      setRide(rideData)

      const reviewedUserId = rideData?.passenger_id === user.id 
        ? rideData?.driver_id 
        : rideData?.passenger_id

      if (reviewedUserId) {
        const { data: reviewedUserData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', reviewedUserId)
          .single()
        
        setReviewedUser(reviewedUserData)

        // Load categories based on user type
        const userType = rideData?.passenger_id === user.id ? 'driver' : 'passenger'
        const { data: categoriesData } = await supabase
          .from('rating_categories')
          .select('category_key, category_name, category_icon')
          .eq('user_type', userType)
          .order('display_order')
        
        if (categoriesData) {
          setCategories(categoriesData.map(c => ({
            key: c.category_key,
            name: c.category_name,
            icon: c.category_icon || '⭐'
          })))
        }
      }

      const { data: existingReview } = await supabase
        .from('ratings')
        .select('*')
        .eq('ride_id', params.id)
        .eq('reviewer_id', user.id)
        .single()

      if (existingReview) {
        router.push('/uppi/history')
        return
      }

      setLoading(false)
    }

    loadData()
  }, [params.id, supabase, router])

  const handleSubmit = async () => {
    if (rating === 0 || !currentUser || !reviewedUser) return

    trigger('success')
    setSubmitting(true)

    const { error } = await supabase
      .from('ratings')
      .insert({
        ride_id: params.id as string,
        reviewer_id: currentUser.id,
        reviewed_id: reviewedUser.id,
        rating,
        comment: comment || null,
        tags: selectedTags.length > 0 ? selectedTags : null,
        category_ratings: Object.keys(categoryRatings).length > 0 ? categoryRatings : null,
        is_anonymous: isAnonymous
      })

    if (error) {
      console.error('[v0] Error submitting review:', error)
      iosToast.error('Erro ao enviar avaliação')
      setSubmitting(false)
      return
    }

    iosToast.success('Avaliação enviada com sucesso!')
    router.push('/uppi/history')
  }

  const toggleTag = (tag: string) => {
    trigger('selection')
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleRatingChange = (newRating: number) => {
    trigger('light')
    setRating(newRating)
  }

  const handleCategoryRating = (key: string, value: number) => {
    trigger('light')
    setCategoryRatings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  const isDriver = ride?.passenger_id === currentUser?.id
  const tagList = rating >= 3 ? POSITIVE_TAGS : NEGATIVE_TAGS

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 ios-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full ios-press"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-semibold">Avaliar Corrida</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 pb-24">
        {/* User Card */}
        <div className="bg-card rounded-[20px] p-6 mb-4 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-primary">
            {reviewedUser?.full_name?.charAt(0) || 'U'}
          </div>
          <h2 className="text-[20px] font-bold mb-1">{reviewedUser?.full_name}</h2>
          <p className="text-[14px] text-muted-foreground">
            Como foi sua experiência {isDriver ? 'com este motorista' : 'com este passageiro'}?
          </p>
        </div>

        {/* Overall Rating */}
        <div className="bg-card rounded-[20px] p-6 mb-4">
          <h3 className="text-[17px] font-semibold mb-4">Avaliação Geral</h3>
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingChange(star)}
                className="ios-press"
              >
                <Star 
                  className={`w-12 h-12 ${
                    star <= rating 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-muted'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-[15px] font-medium">
              {rating === 5 && '⭐ Excelente!'}
              {rating === 4 && '😊 Muito bom!'}
              {rating === 3 && '👍 Bom'}
              {rating === 2 && '😐 Regular'}
              {rating === 1 && '😞 Ruim'}
            </p>
          )}
        </div>

        {/* Category Ratings */}
        {rating > 0 && categories.length > 0 && (
          <div className="bg-card rounded-[20px] p-6 mb-4">
            <h3 className="text-[17px] font-semibold mb-4">Avalie por Categoria</h3>
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[15px] font-medium">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {categoryRatings[cat.key] || 0}/5
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleCategoryRating(cat.key, value)}
                        className="flex-1 h-8 rounded-lg border-2 transition-colors ios-press"
                        style={{
                          borderColor: value <= (categoryRatings[cat.key] || 0) 
                            ? 'hsl(var(--primary))' 
                            : 'hsl(var(--border))',
                          backgroundColor: value <= (categoryRatings[cat.key] || 0) 
                            ? 'hsl(var(--primary) / 0.1)' 
                            : 'transparent'
                        }}
                      >
                        <span className="text-[12px] font-semibold">{value}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {rating > 0 && (
          <div className="bg-card rounded-[20px] p-6 mb-4">
            <h3 className="text-[17px] font-semibold mb-3">
              {rating >= 3 ? 'Adicione elogios' : 'O que aconteceu?'} (opcional)
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ios-press ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {rating > 0 && (
          <div className="bg-card rounded-[20px] p-6 mb-4">
            <h3 className="text-[17px] font-semibold mb-3">Comentário (opcional)</h3>
            <textarea
              placeholder="Conte mais sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-[15px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Anonymous Option */}
        {rating > 0 && (
          <div className="bg-card rounded-[20px] p-4 mb-4 flex items-center justify-between">
            <span className="text-[15px] font-medium">Avaliar anonimamente</span>
            <button
              type="button"
              onClick={() => {
                trigger('selection')
                setIsAnonymous(!isAnonymous)
              }}
              className={`w-12 h-7 rounded-full transition-colors ${
                isAnonymous ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isAnonymous ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 ios-blur border-t border-border p-4 safe-area-bottom">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/uppi/history')}
            className="flex-1 h-[52px] rounded-[16px] bg-secondary text-secondary-foreground font-semibold ios-press"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex-1 h-[52px] rounded-[16px] bg-primary text-primary-foreground font-semibold ios-press disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
