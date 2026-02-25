import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecordingSettingsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function RecordingSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get current preference
  const { data: preference } = await supabase
    .from('user_recording_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <RecordingSettingsClient initialPreference={preference} userId={user.id} />
}
