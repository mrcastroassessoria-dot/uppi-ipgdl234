import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from './config'

export function createClient() {
  console.log('[v0] Creating Supabase client with config:', {
    hasUrl: !!supabaseConfig.url,
    hasKey: !!supabaseConfig.anonKey,
    urlLength: supabaseConfig.url?.length || 0,
    keyLength: supabaseConfig.anonKey?.length || 0
  })
  
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.error('[v0] Missing Supabase config:', supabaseConfig)
    throw new Error('Missing Supabase environment variables. URL and Anon Key are required.')
  }
  
  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey)
}
