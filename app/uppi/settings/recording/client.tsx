'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Mic, Lock, Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { iosToast } from '@/lib/utils/ios-toast'
import { useHaptic } from '@/hooks/use-haptic'

interface RecordingSettingsClientProps {
  initialPreference: any
  userId: string
}

export function RecordingSettingsClient({ initialPreference, userId }: RecordingSettingsClientProps) {
  const [enabled, setEnabled] = useState(initialPreference?.enabled ?? false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const haptic = useHaptic()

  const handleToggle = async () => {
    setLoading(true)
    haptic('light')

    try {
      const { error } = await supabase
        .from('user_recording_preferences')
        .upsert({
          user_id: userId,
          enabled: !enabled,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setEnabled(!enabled)
      haptic('success')
      iosToast.success(
        !enabled ? 'Gravação ativada' : 'Gravação desativada',
        !enabled ? 'Suas corridas serão gravadas' : 'Gravação pausada'
      )
    } catch (error) {
      console.error('[v0] Failed to update preference:', error)
      haptic('error')
      iosToast.error('Erro', 'Não foi possível atualizar configuração')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/[0.92] ios-blur border-b border-border/50">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full ios-press"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-bold text-foreground">Gravação de Corridas</h1>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-6 border border-blue-500/20">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Segurança com Privacidade</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Grave o áudio das suas corridas de forma segura e criptografada. As gravações são automaticamente apagadas após 7 dias.
          </p>
        </div>

        {/* Toggle Card */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            className="w-full px-5 py-4 flex items-center justify-between ios-press disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                enabled ? 'bg-blue-500/20' : 'bg-secondary'
              }`}>
                <Mic className={`w-5 h-5 ${enabled ? 'text-blue-500' : 'text-muted-foreground'}`} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold text-foreground">Gravação Automática</p>
                <p className="text-[13px] text-muted-foreground">
                  {enabled ? 'Ativado' : 'Desativado'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors ${
              enabled ? 'bg-blue-500' : 'bg-secondary'
            } relative`}>
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                enabled ? 'right-0.5' : 'left-0.5'
              }`} />
            </div>
          </button>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          {/* Encryption */}
          <div className="bg-card rounded-2xl p-4 border border-border flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-foreground mb-1">Criptografia AES-256</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Todos os áudios são criptografados antes de serem enviados ao servidor
              </p>
            </div>
          </div>

          {/* Auto Delete */}
          <div className="bg-card rounded-2xl p-4 border border-border flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4 text-purple-500" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-foreground mb-1">Exclusão Automática</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                As gravações são automaticamente apagadas após 7 dias
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        {enabled && (
          <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-amber-700 dark:text-amber-300 leading-relaxed">
                <span className="font-bold">Aviso:</span> Ao ativar a gravação, você concorda que o motorista e passageiros sejam informados que o áudio está sendo gravado.
              </p>
            </div>
          </div>
        )}

        {/* Legal */}
        <div className="pt-4 pb-8">
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            As gravações são usadas exclusivamente para fins de segurança e resolução de disputas. Consulte nossa{' '}
            <a href="/privacy" className="text-blue-500 font-medium">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  )
}
