import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter } from '@/lib/utils/rate-limit'

/**
 * GET /api/v1/reviews/enhanced
 * Buscar avaliações detalhadas com todas as sub-avaliações
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const { success } = await apiLimiter.check(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ride_id = searchParams.get('ride_id')
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Buscar enhanced_reviews com todas as sub-avaliações
    let query = supabase
      .from('enhanced_reviews')
      .select(`
        *,
        ride:rides(id, created_at, pickup_address, dropoff_address),
        reviewer:profiles!enhanced_reviews_reviewer_id_fkey(id, full_name, avatar_url),
        reviewee:profiles!enhanced_reviews_reviewee_id_fkey(id, full_name, avatar_url),
        review_categories(
          id,
          category_name,
          category_rating,
          category_comment
        ),
        review_tags(
          id,
          tag
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (ride_id) {
      query = query.eq('ride_id', ride_id)
    }

    if (user_id) {
      query = query.or(`reviewer_id.eq.${user_id},reviewee_id.eq.${user_id}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Enhanced reviews fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ reviews: data || [] })
  } catch (error: any) {
    console.error('[v0] Enhanced reviews API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/v1/reviews/enhanced
 * Criar avaliação detalhada com categorias e tags
 */
export async function POST(request: Request) {
  try {
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const { success } = await apiLimiter.check(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ride_id, reviewee_id, overall_rating, comment, categories, tags } = body

    // Validação
    if (!ride_id || !reviewee_id || overall_rating === undefined) {
      return NextResponse.json(
        { error: 'ride_id, reviewee_id, e overall_rating são obrigatórios' },
        { status: 400 }
      )
    }

    if (overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json(
        { error: 'overall_rating deve estar entre 1 e 5' },
        { status: 400 }
      )
    }

    // Criar enhanced_review
    const { data: review, error: reviewError } = await supabase
      .from('enhanced_reviews')
      .insert({
        ride_id,
        reviewer_id: user.id,
        reviewee_id,
        overall_rating,
        comment,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('[v0] Enhanced review insert error:', reviewError)
      return NextResponse.json({ error: reviewError.message }, { status: 400 })
    }

    // Inserir categorias
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const categoriesData = categories.map((cat: any) => ({
        review_id: review.id,
        category_name: cat.name,
        category_rating: cat.rating,
        category_comment: cat.comment || null,
      }))

      const { error: catError } = await supabase
        .from('review_categories')
        .insert(categoriesData)

      if (catError) {
        console.error('[v0] Review categories insert error:', catError)
      }
    }

    // Inserir tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagsData = tags.map((tag: string) => ({
        review_id: review.id,
        tag,
      }))

      const { error: tagsError } = await supabase
        .from('review_tags')
        .insert(tagsData)

      if (tagsError) {
        console.error('[v0] Review tags insert error:', tagsError)
      }
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Enhanced review creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
