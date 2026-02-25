import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database'

export const profileService = {
  async getProfile(userId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[v0] Error fetching profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data as Profile }
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating profile:', error)
      return { success: false, error: error.message }
    }

    return { success: true, profile: data as Profile }
  },

  async uploadAvatar(userId: string, file: File) {
    const supabase = createClient()
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) {
      console.error('[v0] Error uploading avatar:', uploadError)
      return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      console.error('[v0] Error updating avatar URL:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, avatarUrl: publicUrl }
  },

  async deleteAccount(userId: string) {
    const supabase = createClient()
    
    // This will cascade delete due to foreign key constraints
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error('[v0] Error deleting account:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  },
}
