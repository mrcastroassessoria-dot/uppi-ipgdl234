import { createClient } from '@/lib/supabase/client'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  created_at?: string
}

class AuthService {
  private supabase: ReturnType<typeof createClient> | null = null

  private getClient() {
    if (!this.supabase) {
      try {
        this.supabase = createClient()
      } catch (error: any) {
        console.error('[v0] Failed to create Supabase client:', error)
        throw new Error('Configuração do banco de dados não disponível. Por favor, tente novamente mais tarde.')
      }
    }
    return this.supabase
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(data: SignUpData) {
    try {
      const client = this.getClient()
      const { data: authData, error: authError } = await client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
        },
      })

      if (authError) throw authError

      // Create profile in profiles table
      if (authData.user) {
        const { error: profileError } = await client
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            created_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error('[v0] Error creating profile:', profileError)
        }
      }

      return { user: authData.user, session: authData.session, error: null }
    } catch (error: any) {
      console.error('[v0] Sign up error:', error)
      return { user: null, session: null, error: error.message }
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData) {
    try {
      const client = this.getClient()
      const { data: authData, error } = await client.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      return { user: authData.user, session: authData.session, error: null }
    } catch (error: any) {
      console.error('[v0] Sign in error:', error)
      return { user: null, session: null, error: error.message }
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const client = this.getClient()
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      console.error('[v0] Google sign in error:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Sign in with Apple OAuth
   */
  async signInWithApple() {
    try {
      const client = this.getClient()
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      console.error('[v0] Apple sign in error:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const client = this.getClient()
      const { error } = await client.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('[v0] Sign out error:', error)
      return { error: error.message }
    }
  }

  /**
   * Get current user session
   */
  async getSession() {
    try {
      const client = this.getClient()
      const { data: { session }, error } = await client.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error: any) {
      console.error('[v0] Get session error:', error)
      return { session: null, error: error.message }
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const client = this.getClient()
      const { data: { user }, error } = await client.auth.getUser()
      if (error) throw error

      if (!user) return null

      // Get profile data
      const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name,
        phone: profile?.phone,
        avatar_url: profile?.avatar_url,
        created_at: profile?.created_at,
      }
    } catch (error: any) {
      console.error('[v0] Get current user error:', error)
      return null
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      const client = this.getClient()
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      console.error('[v0] Reset password error:', error)
      return { error: error.message }
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    try {
      const client = this.getClient()
      const { error } = await client.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      console.error('[v0] Update password error:', error)
      return { error: error.message }
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = this.getClient()
    return client.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
