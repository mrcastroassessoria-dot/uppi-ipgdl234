import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a driver
    const { data: driverProfile, error: driverError } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (driverError || !driverProfile) {
      return NextResponse.json({ error: 'Not a driver' }, { status: 403 })
    }

    const body = await request.json()
    const { photo_url, device_info } = body

    if (!photo_url) {
      return NextResponse.json({ error: 'Photo required' }, { status: 400 })
    }

    // In production, this would call a facial recognition API
    // For now, we'll simulate verification with a high confidence score
    const confidence_score = 0.95 + Math.random() * 0.05 // 0.95-1.00

    // Create verification record
    const { data: verification, error: verifyError } = await supabase
      .from('driver_verifications')
      .insert({
        driver_id: user.id,
        photo_url,
        status: confidence_score >= 0.90 ? 'verified' : 'failed',
        confidence_score,
        device_info: device_info || {},
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      })
      .select()
      .single()

    if (verifyError) throw verifyError

    // Update driver profile
    if (confidence_score >= 0.90) {
      await supabase
        .from('driver_profiles')
        .update({
          last_verification_at: new Date().toISOString(),
          verification_photo_url: photo_url,
          verification_status: 'verified',
          requires_verification: false,
          verification_attempts: 0,
        })
        .eq('id', user.id)
    } else {
      // Increment failed attempts
      await supabase
        .from('driver_profiles')
        .update({
          verification_status: 'failed',
          verification_attempts: (driverProfile.verification_attempts || 0) + 1,
        })
        .eq('id', user.id)
    }

    return NextResponse.json({
      success: confidence_score >= 0.90,
      verification,
      message: confidence_score >= 0.90
        ? 'Verificacao facial aprovada'
        : 'Verificacao facial falhou. Tente novamente.',
    })
  } catch (error) {
    console.error('[API] Error verifying driver:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if verification is needed
    const { data, error } = await supabase.rpc('needs_facial_verification', {
      p_driver_id: user.id,
    })

    if (error) throw error

    return NextResponse.json({ needs_verification: data })
  } catch (error) {
    console.error('[API] Error checking verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
