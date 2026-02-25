import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

// Twilio SMS sender (fallback for push notifications)
export async function POST(request: Request) {
  try {
    // Rate limit: 10 SMS per minute
    const rlResult = apiLimiter.check(request, 10)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phone_number, message, notification_id } = body

    if (!phone_number || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user has SMS enabled and verified
    const { data: preferences } = await supabase
      .from('user_sms_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('enabled', true)
      .eq('phone_verified', true)
      .single()

    if (!preferences) {
      return NextResponse.json({ error: 'SMS not enabled or phone not verified' }, { status: 403 })
    }

    // Calculate message segments (160 chars per segment)
    const segments = Math.ceil(message.length / 160)

    // Create SMS delivery record
    const { data: delivery, error: insertError } = await supabase
      .from('sms_deliveries')
      .insert({
        user_id: user.id,
        phone_number,
        message,
        notification_id,
        segments,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Error creating SMS delivery:', insertError)
      return NextResponse.json({ error: 'Failed to create SMS delivery' }, { status: 500 })
    }

    // Send SMS via Twilio (or other provider)
    const smsResult = await sendSMS(phone_number, message)

    // Update delivery status
    if (smsResult.success) {
      await supabase
        .from('sms_deliveries')
        .update({
          status: 'sent',
          provider_message_id: smsResult.messageId,
          sent_at: new Date().toISOString(),
          cost_cents: smsResult.cost_cents,
        })
        .eq('id', delivery.id)

      return NextResponse.json({ success: true, delivery_id: delivery.id })
    } else {
      await supabase
        .from('sms_deliveries')
        .update({
          status: 'failed',
          error_message: smsResult.error,
          failed_at: new Date().toISOString(),
          retry_count: delivery.retry_count + 1,
        })
        .eq('id', delivery.id)

      return NextResponse.json(
        { error: 'Failed to send SMS', details: smsResult.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[v0] SMS send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// SMS sending function (Twilio integration)
async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; cost_cents?: number; error?: string }> {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

  // If Twilio not configured, return error
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('[v0] Twilio credentials not configured')
    return { success: false, error: 'SMS provider not configured' }
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[v0] Twilio API error:', error)
      return { success: false, error: `Twilio error: ${response.status}` }
    }

    const data = await response.json()
    
    // Estimate cost (Twilio charges ~$0.0075 per SMS segment)
    const segments = Math.ceil(message.length / 160)
    const cost_cents = Math.ceil(segments * 0.75) // 0.75 cents per segment

    return {
      success: true,
      messageId: data.sid,
      cost_cents,
    }
  } catch (error) {
    console.error('[v0] SMS send error:', error)
    return { success: false, error: 'Network error' }
  }
}

// Process pending SMS (called by cron)
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get pending SMS
    const { data: pendingSMS } = await supabase.rpc('process_pending_sms')

    if (!pendingSMS || pendingSMS.length === 0) {
      return NextResponse.json({ processed: 0 })
    }

    let processed = 0
    let failed = 0

    for (const sms of pendingSMS) {
      const result = await sendSMS(sms.phone_number, sms.message)

      if (result.success) {
        await supabase
          .from('sms_deliveries')
          .update({
            status: 'sent',
            provider_message_id: result.messageId,
            sent_at: new Date().toISOString(),
            cost_cents: result.cost_cents,
          })
          .eq('id', sms.sms_id)
        processed++
      } else {
        await supabase
          .from('sms_deliveries')
          .update({
            status: 'failed',
            error_message: result.error,
            failed_at: new Date().toISOString(),
            retry_count: sms.retry_count + 1,
          })
          .eq('id', sms.sms_id)
        failed++
      }
    }

    return NextResponse.json({ processed, failed, total: pendingSMS.length })
  } catch (error) {
    console.error('[v0] SMS cron error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
