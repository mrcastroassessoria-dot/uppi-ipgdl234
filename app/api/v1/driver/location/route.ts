import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter } from '@/lib/utils/rate-limit'

/**
 * PATCH /api/v1/driver/location
 * Atualizar localização do motorista em tempo real (PostGIS)
 * 
 * Esta API é chamada frequentemente (a cada 5-10s) durante corridas ativas.
 * Rate limit mais alto para evitar bloqueios.
 */
export async function PATCH(request: Request) {
  try {
    // Rate limiting mais permissivo para updates de localização
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
    const { latitude, longitude, heading, speed } = body

    // Validação
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'latitude e longitude são obrigatórios' },
        { status: 400 }
      )
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Coordenadas inválidas' },
        { status: 400 }
      )
    }

    // Verificar se é motorista
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || profile.user_type !== 'driver') {
      return NextResponse.json(
        { error: 'Apenas motoristas podem atualizar localização' },
        { status: 403 }
      )
    }

    // Atualizar localização no driver_profiles usando PostGIS
    // ST_SetSRID(ST_MakePoint(lng, lat), 4326) cria uma geometria POINT com SRID 4326 (WGS84)
    const { data, error } = await supabase.rpc('update_driver_location', {
      p_driver_id: user.id,
      p_latitude: latitude,
      p_longitude: longitude,
      p_heading: heading || null,
      p_speed: speed || null,
    })

    if (error) {
      console.error('[v0] Driver location update error:', error)
      
      // Fallback: atualizar diretamente se a RPC não existir
      const { error: updateError } = await supabase
        .from('driver_profiles')
        .update({
          current_location: `POINT(${longitude} ${latitude})`,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[v0] Driver location fallback update error:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: true,
      location: { latitude, longitude, heading, speed },
      updated_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[v0] Driver location API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/v1/driver/location
 * Buscar localização atual do motorista
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
    const driver_id = searchParams.get('driver_id') || user.id

    // Buscar localização do motorista
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('id, current_location, last_location_update, is_online, is_available')
      .eq('id', driver_id)
      .single()

    if (error) {
      console.error('[v0] Driver location fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Motorista não encontrado' }, { status: 404 })
    }

    // Extrair coordenadas do POINT PostGIS
    // Formato: "POINT(lng lat)" ou null
    let location = null
    if (data.current_location) {
      // Parse "POINT(lng lat)"
      const match = data.current_location.match(/POINT\(([^ ]+) ([^ ]+)\)/)
      if (match) {
        location = {
          latitude: parseFloat(match[2]),
          longitude: parseFloat(match[1]),
        }
      }
    }

    return NextResponse.json({
      driver_id: data.id,
      location,
      last_update: data.last_location_update,
      is_online: data.is_online,
      is_available: data.is_available,
    })
  } catch (error: any) {
    console.error('[v0] Driver location GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
