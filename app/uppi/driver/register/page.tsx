'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { driverRegisterSchema, validateForm } from '@/lib/validations/schemas'
import { iosToast } from '@/lib/utils/ios-toast'
import { Car, CreditCard, ChevronLeft, Info, CheckCircle2 } from 'lucide-react'

export default function DriverRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    vehicle_type: 'car',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_color: '',
    vehicle_plate: '',
    vehicle_year: '',
    license_number: '',
    license_category: 'B'
  })
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

    // Validate with Zod
    const validation = validateForm(driverRegisterSchema, formData)
    if (!validation.success) {
      setFieldErrors(validation.errors || {})
      iosToast.error('Corrija os campos em vermelho')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('driver_profiles')
        .insert({
          id: user.id,
          ...formData,
          status: 'pending',
          vehicle_year: parseInt(formData.vehicle_year)
        })

      if (error) throw error

      // Update user type in profiles
      await supabase
        .from('profiles')
        .update({ user_type: 'driver' })
        .eq('id', user.id)

      iosToast.success('Cadastro enviado! Aguarde aprovacao')
      setTimeout(() => router.push('/uppi/driver-mode/active'), 1000)
    } catch (error) {
      console.error('[v0] Driver registration error:', error)
      iosToast.error('Erro ao enviar cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-dvh overflow-y-auto bg-background ios-scroll">
      <header className="bg-card/80 ios-blur-heavy border-b border-border/40 sticky top-0 z-30">
        <div className="px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full ios-press -ml-1 group"
            >
              <ChevronLeft className="w-7 h-7 text-[#007AFF] group-active:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[12px] bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <Car className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-[28px] font-bold text-foreground tracking-[-0.8px] leading-[1.15]">Cadastro de Motorista</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 pb-24 max-w-2xl mx-auto animate-ios-fade-up">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card/80 ios-blur-heavy rounded-[20px] p-5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.04),0_2px_12px_rgba(0,0,0,0.3)] border-[0.5px] border-border/50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-[12px] bg-blue-500/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
              </div>
              <h2 className="text-[22px] font-bold text-foreground tracking-[-0.5px]">Informações do Veículo</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[15px] font-medium text-foreground mb-1.5">Tipo de Veículo</Label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full mt-1.5 px-4 py-3 bg-background/50 border border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-[17px]"
                  required
                >
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                  <option value="van">Van</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[15px] font-medium text-foreground mb-1.5">Marca</Label>
                  <Input
                    value={formData.vehicle_brand}
                    onChange={(e) => setFormData({ ...formData, vehicle_brand: e.target.value })}
                    placeholder="Ex: Toyota"
                    className="h-11 px-4 bg-background/50 border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 text-[17px]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[15px] font-medium text-foreground mb-1.5">Modelo</Label>
                  <Input
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                    placeholder="Ex: Corolla"
                    className="h-11 px-4 bg-background/50 border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 text-[17px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[15px] font-medium text-foreground mb-1.5">Cor</Label>
                  <Input
                    value={formData.vehicle_color}
                    onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                    placeholder="Ex: Preto"
                    className="h-11 px-4 bg-background/50 border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 text-[17px]"
                    required
                  />
                </div>
                <div>
                  <Label className="text-[15px] font-medium text-foreground mb-1.5">Ano</Label>
                  <Input
                    type="number"
                    value={formData.vehicle_year}
                    onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                    placeholder="Ex: 2020"
                    className="h-11 px-4 bg-background/50 border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 text-[17px]"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-[15px] font-medium text-foreground mb-1.5">Placa</Label>
                <Input
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value.toUpperCase() })}
                  placeholder="ABC1D23"
                  className="h-11 px-4 bg-background/50 border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 text-[17px] font-mono uppercase"
                  maxLength={7}
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-card/80 ios-blur-heavy rounded-[20px] p-5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.04),0_2px_12px_rgba(0,0,0,0.3)] border-[0.5px] border-border/50 animate-ios-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-[12px] bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
              </div>
              <h2 className="text-[22px] font-bold text-foreground tracking-[-0.5px]">Carteira de Motorista</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[15px] font-medium text-foreground mb-1.5">Número da CNH</Label>
                <Input
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="Digite o número"
                  className="h-11 px-4 bg-background/50 border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 text-[17px] font-mono"
                  required
                />
              </div>

              <div>
                <Label className="text-[15px] font-medium text-foreground mb-1.5">Categoria</Label>
                <select
                  value={formData.license_category}
                  onChange={(e) => setFormData({ ...formData, license_category: e.target.value })}
                  className="w-full h-11 px-4 bg-background/50 border border-border/50 rounded-[12px] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 text-[17px] transition-all"
                  required
                >
                  <option value="A">A (Moto)</option>
                  <option value="B">B (Carro)</option>
                  <option value="AB">AB (Moto e Carro)</option>
                  <option value="C">C (Caminhão pequeno)</option>
                  <option value="D">D (Ônibus)</option>
                  <option value="E">E (Caminhão com reboque)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#007AFF]/10 to-cyan-500/10 dark:from-[#007AFF]/15 dark:to-cyan-500/15 rounded-[18px] p-4 border border-[#007AFF]/20 animate-ios-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-[#007AFF] to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                <Info className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-[15px]">
                <p className="font-bold mb-1.5 text-foreground">Seus documentos serão verificados</p>
                <p className="text-[#8E8E93] leading-relaxed">O processo de aprovação pode levar até 48 horas. Você receberá uma notificação quando seu cadastro for aprovado.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 text-[17px] rounded-[16px] transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 group animate-ios-fade-up"
            style={{ animationDelay: '300ms' }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 group-active:scale-110 transition-transform" strokeWidth={2.5} />
                <span>Enviar Cadastro</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
