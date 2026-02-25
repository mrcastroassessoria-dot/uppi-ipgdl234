'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, Gauge, Clock, TrendingUp, ChevronRight, Camera, Bell, CreditCard, HelpCircle, LogOut, Award, Car } from 'lucide-react'
import type { Profile, DriverProfile } from '@/lib/types/database'
import ProfileSkeleton from '@/components/profile-skeleton'
import { BottomNavigation } from '@/components/bottom-navigation'
import { iosToast } from '@/lib/utils/ios-toast'
import { profileUpdateSchema, validateForm } from '@/lib/validations/schemas'
import { setManualThemePreference, clearManualThemePreference } from '@/components/auto-theme'
import { profileService } from '@/lib/services/profile-service'
import { storageService } from '@/lib/services/storage-service'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
        setFullName(profileData?.full_name || '')
        setPhone(profileData?.phone || '')

        if (profileData?.user_type === 'driver' || profileData?.user_type === 'both') {
          const { data: driverData } = await supabase
            .from('driver_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          setDriverProfile(driverData)
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  const handleSave = async () => {
    const validation = validateForm(profileUpdateSchema, { full_name: fullName, phone })
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]
      iosToast.error(firstError || 'Dados invalidos')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const result = await profileService.updateProfile(user.id, {
        full_name: fullName,
        phone,
      })

      if (!result.success) {
        iosToast.error('Erro ao salvar perfil')
        return
      }
      
      iosToast.success('Perfil atualizado')
      setEditing(false)
      setProfile(result.profile)
    } catch {
      iosToast.error('Erro ao salvar perfil')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { url, error } = await storageService.uploadAvatar(user.id, file)
      
      if (error) {
        iosToast.error('Erro ao enviar foto')
        return
      }

      if (url) {
        await profileService.updateProfile(user.id, { avatar_url: url })
        setProfile(prev => prev ? { ...prev, avatar_url: url } : null)
        iosToast.success('Foto atualizada')
      }
    } catch (error) {
      console.error('[v0] Avatar upload error:', error)
      iosToast.error('Erro ao enviar foto')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/welcome')
    router.refresh()
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="h-dvh overflow-y-auto bg-[#F2F2F7] dark:bg-black pb-24 ios-scroll">
      {/* Header - iOS style */}
      <header className="bg-white/80 dark:bg-black/80 ios-blur-heavy border-b border-black/[0.08] dark:border-white/[0.1] sticky top-0 z-30">
        <div className="px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Voltar"
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full ios-press -ml-1"
            >
              <svg aria-hidden="true" className="w-6 h-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-[34px] font-bold text-foreground tracking-[-0.8px] leading-[1.15]">Perfil</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 max-w-2xl mx-auto stagger-children">
        {/* Profile Header - iOS card */}
        <div className="bg-white/90 dark:bg-[#1C1C1E]/90 ios-blur rounded-[24px] p-6 mb-4 text-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.04),0_2px_12px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.3)] border-[0.5px] border-black/[0.06] dark:border-white/[0.08]">
          <div className="relative inline-block mb-4">
            <Avatar className="w-28 h-28">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>
                {profile?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-gradient-to-br from-[#007AFF] to-[#0066CC] text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform ios-press"
            >
              <Camera className="w-5 h-5" strokeWidth={2.5} />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <h2 className="text-[28px] font-bold text-foreground tracking-[-0.6px] mb-1">{profile?.full_name}</h2>
          <p className="text-[15px] text-[#8E8E93] mb-6">{profile?.phone}</p>
          <div className="flex gap-8 justify-center">
            <div>
              <div className="text-[32px] font-bold text-[#007AFF] tracking-[-0.8px] tabular-nums">{profile?.rating?.toFixed(1) || '5.0'}</div>
              <div className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Avaliacao</div>
            </div>
            <div className="w-[0.5px] bg-black/[0.08] dark:bg-white/[0.1]" />
            <div>
              <div className="text-[32px] font-bold text-[#007AFF] tracking-[-0.8px] tabular-nums">{profile?.total_rides || 0}</div>
              <div className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Corridas</div>
            </div>
          </div>
        </div>

        {/* Profile Tabs - iOS segmented control style */}
        <Tabs defaultValue="info" className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-black/[0.06] dark:bg-white/[0.08] rounded-[14px] h-[36px] p-[2px]">
            <TabsTrigger value="info" className="rounded-[12px] text-[15px] font-semibold tracking-[-0.2px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C1C1E] data-[state=active]:text-foreground data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              Informacoes
            </TabsTrigger>
            <TabsTrigger value="vehicle" className="rounded-[12px] text-[15px] font-semibold tracking-[-0.2px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#1C1C1E] data-[state=active]:text-foreground data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              Veiculo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="bg-card rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Nome Completo</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 h-[48px] rounded-[14px] border-border text-[17px]" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Telefone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-[48px] rounded-[14px] border-border text-[17px]" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={handleSave} className="flex-1 h-[48px] rounded-[14px] bg-blue-500 text-white font-semibold text-[17px] ios-press">Salvar</button>
                    <button type="button" onClick={() => setEditing(false)} className="flex-1 h-[48px] rounded-[14px] bg-secondary text-foreground font-semibold text-[17px] ios-press">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Nome Completo</p>
                    <p className="text-[17px] font-medium text-foreground mt-0.5">{profile?.full_name}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Telefone</p>
                    <p className="text-[17px] font-medium text-foreground mt-0.5">{profile?.phone}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Conta</p>
                    <p className="text-[17px] font-medium text-foreground capitalize mt-0.5">{profile?.user_type}</p>
                  </div>
                  
                  {/* Switch to Driver Button - show for passenger or when user_type is not set */}
                  {profile && profile.user_type !== 'driver' && profile.user_type !== 'both' && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-[16px] p-4 border border-green-500/20 animate-ios-fade-up">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30 animate-ios-pulse">
                            <Gauge className="w-6 h-6 text-white" strokeWidth={2.5} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[16px] font-bold text-foreground mb-1">Vire Motorista</p>
                            <p className="text-[13px] text-[#8E8E93] leading-relaxed mb-2">Ganhe dinheiro dirigindo com seu próprio veículo</p>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { icon: DollarSign, text: 'Defina preços' },
                                { icon: Clock, text: 'Horário flexível' },
                                { icon: TrendingUp, text: 'Ganhos extras' }
                              ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[12px] text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
                                  <item.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                                  <span className="font-medium">{item.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => router.push('/uppi/driver/register')} 
                          className="w-full h-[48px] rounded-[14px] bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-[16px] ios-press shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 group"
                        >
                          <span>Começar Cadastro</span>
                          <ChevronRight className="w-5 h-5 group-active:translate-x-1 transition-transform" strokeWidth={2.5} />
                        </button>
                      </div>
                    </>
                  )}
                  
                  <button type="button" onClick={() => setEditing(true)} className="w-full h-[48px] rounded-[14px] bg-blue-500 text-white font-semibold text-[17px] mt-2 ios-press">Editar Perfil</button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vehicle">
            <div className="bg-card rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              {driverProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Marca', value: driverProfile.vehicle_brand },
                      { label: 'Modelo', value: driverProfile.vehicle_model },
                      { label: 'Ano', value: driverProfile.vehicle_year },
                      { label: 'Cor', value: driverProfile.vehicle_color },
                      { label: 'Placa', value: driverProfile.vehicle_plate, mono: true },
                      { label: 'Tipo', value: driverProfile.vehicle_type, capitalize: true },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                        <p className={`text-[17px] font-medium text-foreground mt-0.5 ${item.mono ? 'font-mono uppercase' : ''} ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-foreground">Verificacao</span>
                    {driverProfile.is_verified ? (
                      <span className="text-green-500 font-semibold text-[15px] flex items-center gap-1.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Verificado
                      </span>
                    ) : (
                      <span className="text-amber-500 font-semibold text-[15px]">Pendente</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-[20px] bg-muted/30 flex items-center justify-center">
                    <Car className="w-8 h-8 text-muted-foreground/40" strokeWidth={1.5} />
                  </div>
                  <p className="text-[17px] font-semibold text-foreground mb-1">Sem veiculo cadastrado</p>
                  <p className="text-[15px] text-muted-foreground">Apenas motoristas precisam cadastrar veiculo</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Achievements banner */}
        <button
          type="button"
          onClick={() => router.push('/uppi/achievements')}
          className="w-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-[20px] p-4 mb-5 shadow-lg shadow-amber-500/30 ios-press text-left flex items-center gap-4 group animate-ios-fade-up"
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-[16px] flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
            <Award className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-[17px] font-bold text-white mb-0.5">Conquistas e Emblemas</p>
            <p className="text-[13px] text-white/80">Veja seu progresso e desbloqueie emblemas</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/70 shrink-0 group-active:translate-x-1 transition-transform" strokeWidth={3} />
        </button>

        {/* Settings - iOS grouped list style */}
        <div className="bg-card rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] mb-5 animate-ios-fade-up">
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide px-5 pt-4 pb-2">Configuracoes</p>
          {[
            { icon: Bell, label: 'Notificacoes', color: 'text-red-500' },
            { icon: CreditCard, label: 'Formas de Pagamento', color: 'text-blue-500' },
            { icon: HelpCircle, label: 'Ajuda e Suporte', color: 'text-purple-500' },
          ].map((item, i) => {
            const IconComponent = item.icon
            return (
              <button key={item.label} type="button" className={`w-full flex items-center gap-4 px-5 py-4 ios-list-press group ${i < 2 ? 'border-b border-border' : ''}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color === 'text-red-500' ? 'from-red-500/10 to-pink-500/10' : item.color === 'text-blue-500' ? 'from-blue-500/10 to-cyan-500/10' : 'from-purple-500/10 to-indigo-500/10'} flex items-center justify-center`}>
                  <IconComponent className={`w-[18px] h-[18px] ${item.color}`} strokeWidth={2.5} />
                </div>
                <span className="flex-1 text-left text-[17px] text-foreground">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-active:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>
            )
          })}
        </div>

        {/* Logout - iOS style */}
        <div className="bg-card rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] animate-ios-fade-up">
          <button type="button" onClick={handleLogout} className="w-full flex items-center justify-center gap-2.5 h-[52px] text-red-500 text-[17px] font-semibold ios-press group">
            <LogOut className="w-5 h-5 group-active:-translate-x-1 transition-transform" strokeWidth={2.5} />
            Sair da Conta
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  )
}
