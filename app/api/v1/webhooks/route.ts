import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'
import crypto from 'crypto'

// GET - List user's webhook endpoints
export async function GET(request: Request) {
  try {
    const rlResult = apiLimiter.check(request, 20)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ endpoints: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new webhook endpoint
export async function POST(request: Request) {
  try {
    const rlResult = apiLimiter.check(request, 5)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url, events } = body

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Missing url or events' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Validate events
    const validEvents = [
      'ride.created', 'ride.status_changed', 'ride.cancelled',
      'payment.INSERT', 'payment.UPDATE',
      'driver.location_updated', 'offer.received'
    ]
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json({ 
        error: `Invalid events: ${invalidEvents.join(', ')}` 
      }, { status: 400 })
    }

    // Generate secret for HMAC signatures
    const secret = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        user_id: user.id,
        url,
        events,
        secret,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ endpoint: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove webhook endpoint
export async function DELETE(request: Request) {
  try {
    const rlResult = apiLimiter.check(request, 10)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
