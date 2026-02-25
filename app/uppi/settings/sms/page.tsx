'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Phone, Bell, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { iosToast } from '@/lib/utils/ios-toast'

export default function SMSSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [fallbackOnly, setFallbackOnly] = useState(true)
  
  // Event preferences
  const [rideUpdates, setRideUpdates] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [driverArrival, setDriverArrival] = useState(true)
  const [paymentUpdates, setPaymentUpdates] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_sms_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setPhoneNumber(data.phone_number || '')
        setPhoneVerified(data.phone_verified || false)
        setEnabled(data.enabled || false)
        setFallbackOnly(data.fallback_only ?? true)
        setRideUpdates(data.ride_updates ?? true)
        setPriceAlerts(data.price_alerts ?? true)
        setDriverArrival(data.driver_arrival ?? true)
        setPaymentUpdates(data.payment_updates ?? false)
        setMarketing(data.marketing ?? false)
      }
    } catch (error) {
      console.error('[v0] Error loading SMS preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_sms_preferences')
        .upsert({
          user_id: user.id,
          phone_number: phoneNumber,
          phone_verified: phoneVerified,
          enabled,
          fallback_only: fallbackOnly,
          ride_updates: rideUpdates,
          price_alerts: priceAlerts,
          driver_arrival: driverArrival,
          payment_updates: paymentUpdates,
          marketing,
        })

      if (error) throw error

      iosToast.success('Preferências salvas com sucesso')
    } catch (error) {
      console.error('[v0] Error saving SMS preferences:', error)
      iosToast.error('Erro ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  const requestVerification = async () => {
    if (!phoneNumber) {
      iosToast.error('Digite um número de telefone')
      return
    }

    setVerifying(true)
    try {
      // In production, send verification code via SMS
      iosToast.info('Código de verificação enviado por SMS')
      
      // For now, simulate verification
      setTimeout(() => {
        setPhoneVerified(true)
        iosToast.success('Telefone verificado com sucesso')
        setVerifying(false)
      }, 2000)
    } catch (error) {
      console.error('[v0] Error requesting verification:', error)
      iosToast.error('Erro ao enviar código de verificação')
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 ios-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center ios-press"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Notificações por SMS</h1>
            <p className="text-xs text-muted-foreground">Fallback quando push falha</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Warning Card */}
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              SMS tem custo adicional
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Cada SMS custa aproximadamente R$ 0,15. Use como fallback apenas quando necessário.
            </p>
          </div>
        </div>

        {/* Phone Number */}
        <div className="bg-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Número de Telefone</span>
          </div>

          <div className="space-y-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+55 11 99999-9999"
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={phoneVerified}
            />

            {phoneVerified ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Verificado</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={requestVerification}
                disabled={verifying || !phoneNumber}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold ios-press disabled:opacity-50"
              >
                {verifying ? 'Enviando...' : 'Verificar Número'}
              </button>
            )}
          </div>
        </div>

        {/* SMS Settings */}
        {phoneVerified && (
          <>
            {/* Enable SMS */}
            <div className="bg-card rounded-2xl p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Ativar SMS</p>
                    <p className="text-xs text-muted-foreground">Receber notificações por SMS</p>
                  </div>
                </div>
                <div
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    enabled ? 'bg-primary' : 'bg-secondary'
                  }`}
                  onClick={() => setEnabled(!enabled)}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                      enabled ? 'translate-x-5' : ''
                    }`}
                  />
                </div>
              </label>
            </div>

            {enabled && (
              <>
                {/* Fallback Only */}
                <div className="bg-card rounded-2xl p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold">Apenas como fallback</p>
                      <p className="text-xs text-muted-foreground">
                        Enviar SMS só se push falhar
                      </p>
                    </div>
                    <div
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        fallbackOnly ? 'bg-primary' : 'bg-secondary'
                      }`}
                      onClick={() => setFallbackOnly(!fallbackOnly)}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          fallbackOnly ? 'translate-x-5' : ''
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Event Preferences */}
                <div className="bg-card rounded-2xl p-4 space-y-4">
                  <h3 className="text-sm font-semibold">Tipos de Notificação</h3>

                  {[
                    { label: 'Atualizações de Corrida', value: rideUpdates, setter: setRideUpdates },
                    { label: 'Alertas de Preço', value: priceAlerts, setter: setPriceAlerts },
                    { label: 'Chegada do Motorista', value: driverArrival, setter: setDriverArrival },
                    { label: 'Atualizações de Pagamento', value: paymentUpdates, setter: setPaymentUpdates },
                    { label: 'Marketing', value: marketing, setter: setMarketing },
                  ].map((pref, idx) => (
                    <label key={idx} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm">{pref.label}</span>
                      <div
                        className={`relative w-12 h-7 rounded-full transition-colors ${
                          pref.value ? 'bg-primary' : 'bg-secondary'
                        }`}
                        onClick={() => pref.setter(!pref.value)}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                            pref.value ? 'translate-x-5' : ''
                          }`}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={savePreferences}
          disabled={saving || !phoneVerified}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold ios-press disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>
    </div>
  )
}
