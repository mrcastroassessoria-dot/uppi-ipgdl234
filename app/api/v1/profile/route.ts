import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Get user profile
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    // Get user from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get driver data if exists
    const { data: driverData } = await supabase
      .from('drivers')
      .select('*, vehicles(*)')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      ...userData,
      profile: profileData,
      driver: driverData,
    })
  } catch (error) {
    console.error('[v0] Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}

// PATCH - Update profile
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, phone, avatar_url, ...profileData } = body

    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name,
        phone,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (userError) throw userError

    // Update or insert profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) throw profileError

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('[v0] Error updating profile:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
