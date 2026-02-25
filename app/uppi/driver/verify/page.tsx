'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FacialVerification } from '@/components/facial-verification'

export default function DriverVerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [driverName, setDriverName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkDriver()
  }, [])

  const checkDriver = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/onboarding/splash')
        return
      }

      // Get driver name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDriverName(profile.full_name || '')
      }

      setLoading(false)
    } catch (error) {
      console.error('[v0] Error checking driver:', error)
      setLoading(false)
    }
  }

  const handleVerified = async (imageData: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // In production, you would:
      // 1. Upload imageData to Supabase Storage
      // 2. Call an API to verify face against driver's profile photo
      // 3. Store verification timestamp
      
      // For now, just update last_verification_at
      await supabase
        .from('driver_profiles')
        .update({
          last_verification_at: new Date().toISOString()
        })
        .eq('id', user.id)

      // Navigate to driver dashboard
      router.push('/uppi/driver')
    } catch (error) {
      console.error('[v0] Error saving verification:', error)
      iosToast.error('Erro ao salvar verificacao')
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <FacialVerification
      onVerified={handleVerified}
      onCancel={handleCancel}
      driverName={driverName}
    />
  )
}
