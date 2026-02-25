import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verificar se já existe algum admin
    const { data: existingAdmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ error: 'Já existe um admin no sistema' }, { status: 403 })
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Admin',
      },
    })

    if (authError) {
      console.error('[v0] Erro ao criar usuário auth:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Falha ao criar usuário' }, { status: 500 })
    }

    // Criar/atualizar perfil como admin
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName || 'Admin',
        is_admin: true,
        user_type: 'passenger',
        created_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('[v0] Erro ao criar perfil:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error('[v0] Erro geral:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
