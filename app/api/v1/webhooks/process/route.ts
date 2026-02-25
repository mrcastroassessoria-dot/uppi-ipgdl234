import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// to process pending webhook deliveries
export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get pending webhooks (admin query, bypassing RLS)
    const { data: pendingWebhooks, error } = await supabase
      .rpc('get_pending_webhooks', { limit_count: 50 })

    if (error) throw error

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retrying: 0,
    }

    // Process each webhook delivery
    for (const webhook of pendingWebhooks || []) {
      results.processed++

      try {
        // Generate HMAC signature
        const signature = crypto
          .createHmac('sha256', webhook.endpoint_secret)
          .update(JSON.stringify(webhook.payload))
          .digest('hex')

        // Send webhook request
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), webhook.timeout_seconds * 1000)

        const response = await fetch(webhook.endpoint_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Uppi-Signature': signature,
            'X-Uppi-Event': webhook.event_type,
          },
          body: JSON.stringify(webhook.payload),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        const responseBody = await response.text().catch(() => '')

        // Update delivery status
        await supabase.rpc('update_webhook_delivery', {
          delivery_id: webhook.delivery_id,
          new_status: response.ok ? 'success' : 'failed',
          status_code: response.status,
          response: responseBody.slice(0, 1000), // Limit response body size
          error: response.ok ? null : `HTTP ${response.status}`,
        })

        if (response.ok) {
          results.succeeded++
        } else {
          results.failed++
          if (webhook.attempt_count < webhook.max_retries) {
            results.retrying++
          }
        }
      } catch (error: any) {
        // Network error or timeout
        await supabase.rpc('update_webhook_delivery', {
          delivery_id: webhook.delivery_id,
          new_status: 'failed',
          error: error.message,
        })

        results.failed++
        if (webhook.attempt_count < webhook.max_retries) {
          results.retrying++
        }
      }
    }

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('[v0] Webhook processor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Webhook delivery logs
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const endpointId = searchParams.get('endpoint_id')

    if (!endpointId) {
      return NextResponse.json({ error: 'Missing endpoint_id' }, { status: 400 })
    }

    // Verify ownership
    const { data: endpoint } = await supabase
      .from('webhook_endpoints')
      .select('id')
      .eq('id', endpointId)
      .eq('user_id', user.id)
      .single()

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('endpoint_id', endpointId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ deliveries })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
