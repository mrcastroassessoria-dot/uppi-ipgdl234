import { createClient } from '@/lib/supabase/server'

export async function sendNotification({
  userId,
  type,
  title,
  message,
  rideId,
}: {
  userId: string
  type: 'offer' | 'ride' | 'payment' | 'promotion' | 'system'
  title: string
  message: string
  rideId?: string
}) {
  const supabase = await createClient()

  console.log('[v0] Sending notification:', { userId, type, title })

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    ride_id: rideId,
    read: false,
  })

  if (error) {
    console.error('[v0] Error sending notification:', error)
    throw error
  }

  console.log('[v0] Notification sent successfully')
}

export async function notifyNewOffer(
  passengerId: string,
  driverName: string,
  price: number,
  rideId: string
) {
  await sendNotification({
    userId: passengerId,
    type: 'offer',
    title: 'Nova oferta recebida',
    message: `${driverName} ofereceu R$ ${price.toFixed(2)} para sua corrida`,
    rideId,
  })
}

export async function notifyOfferAccepted(
  driverId: string,
  passengerName: string,
  rideId: string
) {
  await sendNotification({
    userId: driverId,
    type: 'ride',
    title: 'Oferta aceita!',
    message: `${passengerName} aceitou sua oferta. Prepare-se para buscar o passageiro.`,
    rideId,
  })
}

export async function notifyRideCancelled(
  userId: string,
  cancelledBy: string,
  rideId: string
) {
  await sendNotification({
    userId,
    type: 'ride',
    title: 'Corrida cancelada',
    message: `A corrida foi cancelada por ${cancelledBy}`,
    rideId,
  })
}

export async function notifyRideStarted(
  passengerId: string,
  driverName: string,
  rideId: string
) {
  await sendNotification({
    userId: passengerId,
    type: 'ride',
    title: 'Corrida iniciada',
    message: `${driverName} iniciou a corrida. Boa viagem!`,
    rideId,
  })
}

export async function notifyRideCompleted(
  passengerId: string,
  driverId: string,
  rideId: string
) {
  // Notify passenger
  await sendNotification({
    userId: passengerId,
    type: 'ride',
    title: 'Corrida finalizada',
    message: 'Avalie sua experiência com o motorista',
    rideId,
  })

  // Notify driver
  await sendNotification({
    userId: driverId,
    type: 'ride',
    title: 'Corrida finalizada',
    message: 'Aguarde a avaliação do passageiro',
    rideId,
  })
}

export async function notifyPaymentProcessed(
  userId: string,
  amount: number,
  type: 'debit' | 'credit'
) {
  const message =
    type === 'debit'
      ? `R$ ${amount.toFixed(2)} debitado da sua carteira`
      : `R$ ${amount.toFixed(2)} creditado na sua carteira`

  await sendNotification({
    userId,
    type: 'payment',
    title: 'Pagamento processado',
    message,
  })
}

export async function notifyPromotion(
  userId: string,
  title: string,
  message: string
) {
  await sendNotification({
    userId,
    type: 'promotion',
    title,
    message,
  })
}
