import { createClient } from '@/lib/supabase/client'

export interface ReviewData {
  ride_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  tags?: string[]
  is_anonymous?: boolean
}

export interface ReviewStats {
  average_rating: number
  total_reviews: number
  rating_distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

class ReviewService {
  private supabase = createClient()

  async submitReview(data: ReviewData) {
    try {
      console.log('[v0] Submitting review:', data)

      // Insert review
      const { data: review, error } = await this.supabase
        .from('ratings')
        .insert({
          ride_id: data.ride_id,
          reviewer_id: data.reviewer_id,
          reviewee_id: data.reviewee_id,
          rating: data.rating,
          comment: data.comment || null,
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Error submitting review:', error)
        return { success: false, error: error.message }
      }

      // Insert tags if provided
      if (data.tags && data.tags.length > 0) {
        const tagInserts = data.tags.map(tag => ({
          review_id: review.id,
          tag_name: tag,
        }))

        await this.supabase
          .from('review_tags')
          .insert(tagInserts)
      }

      // Update reviewee's rating
      await this.updateUserRating(data.reviewee_id)

      // Mark ride as reviewed
      await this.supabase
        .from('rides')
        .update({ 
          passenger_reviewed: data.reviewer_id !== data.reviewee_id,
          driver_reviewed: data.reviewer_id === data.reviewee_id 
        })
        .eq('id', data.ride_id)

      return { success: true, review }
    } catch (error) {
      console.error('[v0] Unexpected error submitting review:', error)
      return { success: false, error: 'Erro inesperado' }
    }
  }

  async getReviewsForUser(userId: string, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('ratings')
        .select(`
          *,
          reviewer:profiles!ratings_reviewer_id_fkey(id, full_name, avatar_url),
          ride:rides(pickup_address, dropoff_address, created_at)
        `)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { success: true, reviews: data }
    } catch (error) {
      console.error('[v0] Error fetching reviews:', error)
      return { success: false, error: 'Erro ao carregar avaliações', reviews: [] }
    }
  }

  async getReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const { data, error } = await this.supabase
        .from('ratings')
        .select('rating')
        .eq('reviewee_id', userId)

      if (error) throw error

      const total = data.length
      if (total === 0) {
        return {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        }
      }

      const sum = data.reduce((acc, r) => acc + r.rating, 0)
      const average = sum / total

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      data.forEach(r => {
        distribution[r.rating as keyof typeof distribution]++
      })

      return {
        average_rating: Number(average.toFixed(1)),
        total_reviews: total,
        rating_distribution: distribution
      }
    } catch (error) {
      console.error('[v0] Error getting review stats:', error)
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    }
  }

  private async updateUserRating(userId: string) {
    const stats = await this.getReviewStats(userId)
    
    await this.supabase
      .from('profiles')
      .update({
        rating: stats.average_rating,
        total_reviews: stats.total_reviews
      })
      .eq('id', userId)
  }

  async hasUserReviewedRide(userId: string, rideId: string) {
    try {
      const { data, error } = await this.supabase
        .from('ratings')
        .select('id')
        .eq('reviewer_id', userId)
        .eq('ride_id', rideId)
        .single()

      return { hasReviewed: !!data, error: error?.message }
    } catch (error) {
      return { hasReviewed: false, error: null }
    }
  }

  // Get suggested tags based on rating
  getSuggestedTags(rating: number): string[] {
    if (rating >= 4) {
      return [
        'Educado',
        'Pontual',
        'Carro limpo',
        'Direção segura',
        'Conversa agradável',
        'Profissional',
        'Rápido',
        'Atencioso'
      ]
    } else if (rating === 3) {
      return [
        'Ok',
        'Normal',
        'Atrasou um pouco',
        'Poderia melhorar',
        'Razoável'
      ]
    } else {
      return [
        'Atrasou muito',
        'Mal educado',
        'Carro sujo',
        'Direção perigosa',
        'Cancelou',
        'Não recomendo',
        'Rota errada'
      ]
    }
  }
}

export const reviewService = new ReviewService()
