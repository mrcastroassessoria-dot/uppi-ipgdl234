import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Send push notification via Firebase Admin SDK
 * 
 * This should be called from server-side only (e.g., when ride status changes)
 * In production, you'd use Firebase Admin SDK with service account
 * 
 * For now, this queues notifications in the database
 * You'll need to set up a Cloud Function or Edge Function to actually send them
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, title, body: messageBody, data } = body

    if (!user_id || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, title, body' },
        { status: 400 }
      )
    }

    // Queue notification in database
    const { error: queueError } = await supabase
      .from('notification_queue')
      .insert({
        user_id,
        title,
        body: messageBody,
        data: data || {},
        status: 'pending'
      })

    if (queueError) throw queueError

    // In production, you would:
    // 1. Get user's FCM token from profiles table
    // 2. Use Firebase Admin SDK to send notification
    // 3. Update notification_queue status to 'sent'

    return NextResponse.json({
      success: true,
      message: 'Notification queued'
    })
  } catch (error) {
    console.error('[v0] Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
