import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's referrals
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:profiles!referrals_referred_id_fkey(id, full_name, avatar_url, created_at)
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get user's referral code and stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, total_referrals, referral_credits')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      referrals: referrals || [],
      referral_code: profile?.referral_code,
      total_referrals: profile?.total_referrals || 0,
      referral_credits: profile?.referral_credits || 0,
    })
  } catch (error) {
    console.error('[API] Error fetching referrals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { referred_email, referral_code } = body

    if (!referral_code) {
      return NextResponse.json({ error: 'Referral code required' }, { status: 400 })
    }

    // Find referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referral_code)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    }

    // Check if already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already used this referral code' }, { status: 400 })
    }

    // Create referral
    const { data: referral, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        referral_code,
        bonus_amount: 10.00,
      })
      .select()
      .single()

    if (error) throw error

    // Update referred_by in profile
    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      referral,
      message: 'Codigo de indicacao aplicado! Voce ganhara R$10 na primeira corrida.',
    })
  } catch (error) {
    console.error('[API] Error creating referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
