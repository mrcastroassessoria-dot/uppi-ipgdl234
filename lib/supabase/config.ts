// Configuração do Supabase
// As variáveis de ambiente são injetadas em build time pelo Next.js

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
} as const

// Validação em desenvolvimento
if (typeof window !== 'undefined' && (!supabaseConfig.url || !supabaseConfig.anonKey)) {
  console.error('[v0] Supabase env vars missing:', {
    url: !!supabaseConfig.url,
    anonKey: !!supabaseConfig.anonKey,
    env: process.env
  })
}
