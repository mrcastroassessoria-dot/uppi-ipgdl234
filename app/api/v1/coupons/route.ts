import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, authLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

export async function GET(request: Request) {
  try {
    // Rate limit: 20 reads per minute
    const rlResult = apiLimiter.check(request, 20)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active coupons that user hasn't claimed yet
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .gte('valid_until', new Date().toISOString())
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error('[v0] Coupons GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit: 5 coupon claims per 5 minutes
    const rlResult = authLimiter.check(request, 5)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'code is required' }, { status: 400 })
    }

    // Check if coupon exists and is valid
    const { data: coupon, error: searchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .gte('valid_until', new Date().toISOString())
      .eq('is_active', true)
      .single()

    if (searchError || !coupon) {
      return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 404 })
    }

    // Check if user already claimed this coupon
    const { data: existing } = await supabase
      .from('user_coupons')
      .select('*')
      .eq('user_id', user.id)
      .eq('coupon_id', coupon.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Você já possui este cupom' }, { status: 400 })
    }

    // Check if coupon reached max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 })
    }

    // Add coupon to user
    const { data: userCoupon, error: insertError } = await supabase
      .from('user_coupons')
      .insert({
        user_id: user.id,
        coupon_id: coupon.id
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Increment current_uses
    await supabase
      .from('coupons')
      .update({ current_uses: (coupon.current_uses || 0) + 1 })
      .eq('id', coupon.id)

    return NextResponse.json({ coupon: userCoupon }, { status: 201 })
  } catch (error) {
    console.error('[v0] Coupons POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
