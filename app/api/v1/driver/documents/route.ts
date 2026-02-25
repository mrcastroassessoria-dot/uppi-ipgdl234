import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get driver documents
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('vehicle_type, vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color, license_number, is_verified')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json(data || {})
  } catch (error) {
    console.error('[v0] Error fetching documents:', error)
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { vehicle_type, vehicle_brand, vehicle_model, vehicle_year, vehicle_plate, vehicle_color, license_number } = body

    // Check if driver profile exists
    const { data: existing } = await supabase
      .from('driver_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    let result

    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('driver_profiles')
        .update({
          vehicle_type,
          vehicle_brand: vehicle_brand || 'N/A',
          vehicle_model,
          vehicle_year: parseInt(vehicle_year),
          vehicle_plate,
          vehicle_color: vehicle_color || 'Branco',
          license_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('driver_profiles')
        .insert({
          id: user.id,
          vehicle_type,
          vehicle_brand: vehicle_brand || 'N/A',
          vehicle_model,
          vehicle_year: parseInt(vehicle_year),
          vehicle_plate,
          vehicle_color: vehicle_color || 'Branco',
          license_number,
          is_verified: false,
          is_available: false
        })
        .select()
        .single()

      if (error) throw error
      result = data

      // Update user type to driver
      await supabase
        .from('profiles')
        .update({ user_type: 'driver' })
        .eq('id', user.id)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Error updating documents:', error)
    return NextResponse.json({ error: 'Erro ao atualizar documentos' }, { status: 500 })
  }
}
