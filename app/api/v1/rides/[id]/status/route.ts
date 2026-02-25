import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { status } = await request.json()

    console.log('[v0] Updating ride status:', params.id, 'to', status)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Validate status
    const validStatuses = ['pending', 'accepted', 'started', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Update ride status
    const { data: ride, error } = await supabase
      .from('rides')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    // Create notification for the other user
    const notifyUserId = status === 'started' || status === 'completed' 
      ? ride.passenger_id 
      : ride.driver_id

    if (notifyUserId) {
      await supabase.from('notifications').insert({
        user_id: notifyUserId,
        type: 'ride',
        title: getStatusTitle(status),
        message: getStatusMessage(status),
        ride_id: params.id,
        read: false
      })
    }

    console.log('[v0] Ride status updated successfully')
    return NextResponse.json(ride)

  } catch (error) {
    console.error('[v0] Error updating ride status:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar status da corrida' },
      { status: 500 }
    )
  }
}

function getStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    accepted: 'Corrida aceita',
    started: 'Corrida iniciada',
    completed: 'Corrida finalizada',
    cancelled: 'Corrida cancelada'
  }
  return titles[status] || 'Atualização de corrida'
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    accepted: 'Sua corrida foi aceita! O motorista está a caminho.',
    started: 'O motorista iniciou a corrida.',
    completed: 'Sua corrida foi finalizada. Avalie sua experiência!',
    cancelled: 'A corrida foi cancelada.'
  }
  return messages[status] || 'O status da sua corrida foi atualizado'
}
