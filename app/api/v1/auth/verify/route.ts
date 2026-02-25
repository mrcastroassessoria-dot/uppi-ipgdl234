import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: profile?.user_type || 'passenger',
        ...profile,
      }
    })
  } catch (error) {
    console.error('[v0] Auth verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
