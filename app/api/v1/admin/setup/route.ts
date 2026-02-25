import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST: First-time admin setup - only works if NO admin exists yet
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if any admin already exists
    const { data: existingAdmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: 'Um admin ja existe. Use o painel para gerenciar admins.' },
        { status: 403 }
      )
    }

    // Get currently authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Promote current user to admin
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Voce agora e admin!' })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET: Check if any admin exists
export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)

    return NextResponse.json({ hasAdmin: (data && data.length > 0) || false })
  } catch {
    return NextResponse.json({ hasAdmin: false })
  }
}
