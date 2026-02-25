import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user achievements
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })

    if (error) throw error

    // Check for newly granted achievements
    const { data: newAchievements, error: grantError } = await supabase.rpc(
      'check_and_grant_achievements',
      { p_user_id: user.id }
    )

    if (grantError) {
      console.error('[API] Error checking achievements:', grantError)
    }

    return NextResponse.json({
      achievements: achievements || [],
      new_achievements: newAchievements || [],
    })
  } catch (error) {
    console.error('[API] Error fetching achievements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Trigger achievement check
    const { data: newAchievements, error } = await supabase.rpc(
      'check_and_grant_achievements',
      { p_user_id: user.id }
    )

    if (error) throw error

    return NextResponse.json({
      new_achievements: newAchievements || [],
      count: newAchievements?.length || 0,
    })
  } catch (error) {
    console.error('[API] Error granting achievements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
