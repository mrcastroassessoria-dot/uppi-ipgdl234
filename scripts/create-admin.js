#!/usr/bin/env node

/**
 * Script para criar o primeiro usuário admin
 * Uso: node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js')

async function createAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erro: Variáveis de ambiente não configuradas')
    console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🔧 Criando usuário admin...')

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@uppi.com',
    password: 'Admin123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin Uppi'
    }
  })

  if (authError) {
    console.error('❌ Erro ao criar usuário:', authError.message)
    process.exit(1)
  }

  console.log('✅ Usuário criado:', authData.user.email)

  // Criar perfil e marcar como admin
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      phone: 'admin@uppi.com', // Usar email como phone temporariamente
      full_name: 'Admin Uppi',
      is_admin: true,
      user_type: 'passenger',
      created_at: new Date().toISOString()
    })

  if (profileError) {
    console.error('❌ Erro ao criar perfil:', profileError.message)
    process.exit(1)
  }

  console.log('✅ Perfil admin criado com sucesso!')
  console.log('\n📧 Email: admin@uppi.com')
  console.log('🔑 Senha: Admin123!')
  console.log('\n🎉 Acesse /admin/login para entrar no painel')
}

createAdmin().catch(console.error)
