import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    // Buscar a corrida
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', params.id)
      .single()

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    // Verificar se o usuário pode cancelar
    if (ride.passenger_id !== user.id && ride.driver_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verificar se a corrida pode ser cancelada
    if (!['pending', 'accepted', 'on_way'].includes(ride.status)) {
      return NextResponse.json(
        { error: 'Ride cannot be cancelled' },
        { status: 400 }
      )
    }

    // Calcular taxa de cancelamento se aplicável
    let cancellationFee = 0
    if (ride.status === 'accepted' || ride.status === 'on_way') {
      cancellationFee = ride.final_price ? ride.final_price * 0.1 : 0 // 10% do valor
    }

    // Atualizar status da corrida
    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancellation_reason: reason,
        cancellation_fee: cancellationFee,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Criar notificação para o outro usuário
    const otherUserId = ride.passenger_id === user.id ? ride.driver_id : ride.passenger_id
    if (otherUserId) {
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'ride',
        title: 'Corrida cancelada',
        message: `A corrida foi cancelada. Motivo: ${reason}`,
        ride_id: params.id,
      })
    }

    return NextResponse.json({ ride: updatedRide, cancellationFee })
  } catch (error) {
    console.error('[v0] Error cancelling ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
