'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Copy, Check, Plus, UserPlus } from 'lucide-react'
import { iosToast } from '@/lib/utils/ios-toast'
import { triggerHaptic } from '@/hooks/use-haptic'
import { groupRideSchema, validateForm } from '@/lib/validations/schemas'

export default function GroupRidePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [inviteCode, setInviteCode] = useState('')
  const [maxPassengers, setMaxPassengers] = useState(4)
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom' | 'by_distance'>('equal')
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [createdGroup, setCreatedGroup] = useState<any>(null)

  const handleCreateGroup = async () => {
    // Validar dados
    const validation = validateForm(groupRideSchema, {
      max_passengers: maxPassengers,
      split_fare: splitMethod === 'equal'
    })

    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]
      iosToast.error(firstError)
      triggerHaptic('error')
      return
    }

    setLoading(true)
    triggerHaptic('impact')
    
    try {
      // Get route data from session
      const routeData = sessionStorage.getItem('selectedRide')
      if (!routeData) {
        iosToast.error('Selecione uma rota primeiro')
        router.push('/uppi/ride/route-input')
        return
      }

      const route = JSON.parse(routeData)

      const response = await fetch('/api/v1/group-rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_passengers: maxPassengers,
          split_method: splitMethod,
          pickup_lat: route.origin.lat,
          pickup_lng: route.origin.lng,
          pickup_address: route.origin.address,
          dropoff_lat: route.destination.lat,
          dropoff_lng: route.destination.lng,
          dropoff_address: route.destination.address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar grupo')
      }

      setCreatedGroup(data.groupRide)
      triggerHaptic('success')
      iosToast.success('Grupo criado com sucesso!')
    } catch (error: any) {
      triggerHaptic('error')
      iosToast.error(error.message || 'Erro ao criar grupo')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!inviteCode || inviteCode.length !== 6) {
      iosToast.error('Digite um código válido de 6 dígitos')
      triggerHaptic('error')
      return
    }

    setLoading(true)
    triggerHaptic('impact')
    
    try {
      // Get pickup/dropoff from session or prompt user
      const routeData = sessionStorage.getItem('selectedRide')
      if (!routeData) {
        iosToast.error('Configure sua localização primeiro')
        router.push('/uppi/ride/route-input')
        return
      }

      const route = JSON.parse(routeData)

      const response = await fetch('/api/v1/group-rides/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: inviteCode,
          pickup_lat: route.origin.lat,
          pickup_lng: route.origin.lng,
          pickup_address: route.origin.address,
          dropoff_lat: route.destination.lat,
          dropoff_lng: route.destination.lng,
          dropoff_address: route.destination.address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao entrar no grupo')
      }

      triggerHaptic('success')
      iosToast.success('Você entrou no grupo!')
      // Navigate to ride tracking
      router.push(`/uppi/ride/${data.groupRide.ride_id}/tracking`)
    } catch (error: any) {
      triggerHaptic('error')
      iosToast.error(error.message || 'Erro ao entrar no grupo')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteCode = () => {
    if (createdGroup?.invite_code) {
      navigator.clipboard.writeText(createdGroup.invite_code)
      setCopiedCode(true)
      triggerHaptic('success')
      iosToast.success('Código copiado!')
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  if (createdGroup) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-card/[0.92] ios-blur border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center ios-press"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] font-semibold">Grupo Criado</h1>
            <div className="w-9" />
          </div>
        </div>

        {/* Success Content */}
        <div className="px-4 py-6 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center py-8">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-12 h-12 text-emerald-500" />
            </div>
          </div>

          {/* Invite Code Card */}
          <div className="ios-card p-6 text-center space-y-4">
            <h2 className="text-[20px] font-bold">Código de Convite</h2>
            <p className="text-muted-foreground text-[15px]">
              Compartilhe este código com seus amigos
            </p>
            
            <div className="bg-secondary/50 rounded-2xl p-6 space-y-3">
              <div className="text-[36px] font-bold tracking-[0.3em] text-primary">
                {createdGroup.invite_code}
              </div>
              
              <button
                type="button"
                onClick={copyInviteCode}
                className="w-full ios-button-primary h-12 rounded-xl flex items-center justify-center gap-2"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar Código
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Group Details */}
          <div className="ios-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[15px]">Máximo de passageiros</span>
              <span className="font-semibold">{createdGroup.max_passengers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[15px]">Método de divisão</span>
              <span className="font-semibold capitalize">{createdGroup.split_method === 'equal' ? 'Igual' : createdGroup.split_method}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-[15px]">Status</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[13px] font-semibold">
                Aberto
              </span>
            </div>
          </div>

          {/* Continue Button */}
          <button
            type="button"
            onClick={() => router.push('/uppi/ride/select')}
            className="w-full ios-button-primary h-14 rounded-2xl text-[17px] font-semibold"
          >
            Continuar para Seleção de Veículo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/[0.92] ios-blur border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center ios-press"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-semibold">Corrida em Grupo</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-4">
        <div className="ios-card p-1 flex gap-1">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 h-10 rounded-lg text-[15px] font-semibold transition-all ${
              mode === 'create'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <Plus className="w-4 h-4 inline-block mr-2" />
            Criar Grupo
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 h-10 rounded-lg text-[15px] font-semibold transition-all ${
              mode === 'join'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4 inline-block mr-2" />
            Entrar no Grupo
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {mode === 'create' ? (
          <>
            {/* Info Card */}
            <div className="ios-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[15px]">Divida os custos</h3>
                  <p className="text-muted-foreground text-[14px] mt-1">
                    Convide amigos e divida o valor da corrida automaticamente
                  </p>
                </div>
              </div>
            </div>

            {/* Max Passengers */}
            <div className="ios-card p-4 space-y-3">
              <label className="text-[15px] font-semibold">Máximo de Passageiros</label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxPassengers(num)}
                    className={`flex-1 h-12 rounded-xl text-[15px] font-semibold transition-all ${
                      maxPassengers === num
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Method */}
            <div className="ios-card p-4 space-y-3">
              <label className="text-[15px] font-semibold">Método de Divisão</label>
              <div className="space-y-2">
                {[
                  { value: 'equal', label: 'Dividir Igualmente', desc: 'Todos pagam o mesmo valor' },
                  { value: 'by_distance', label: 'Por Distância', desc: 'Proporcional à distância percorrida' },
                  { value: 'custom', label: 'Customizado', desc: 'Você define quanto cada um paga' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setSplitMethod(method.value as any)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      splitMethod === method.value
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-secondary border-2 border-transparent'
                    }`}
                  >
                    <div className="font-semibold text-[15px]">{method.label}</div>
                    <div className="text-muted-foreground text-[13px] mt-0.5">{method.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={loading}
              className="w-full ios-button-primary h-14 rounded-2xl text-[17px] font-semibold disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Grupo'}
            </button>
          </>
        ) : (
          <>
            {/* Join Info */}
            <div className="ios-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-[15px]">Entre no grupo</h3>
                  <p className="text-muted-foreground text-[14px] mt-1">
                    Digite o código de 6 dígitos compartilhado pelo criador
                  </p>
                </div>
              </div>
            </div>

            {/* Invite Code Input */}
            <div className="ios-card p-4 space-y-3">
              <label className="text-[15px] font-semibold">Código de Convite</label>
              <input
                type="text"
                maxLength={6}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="000000"
                className="w-full h-16 bg-secondary rounded-xl text-center text-[28px] font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Join Button */}
            <button
              type="button"
              onClick={handleJoinGroup}
              disabled={loading || inviteCode.length !== 6}
              className="w-full ios-button-primary h-14 rounded-2xl text-[17px] font-semibold disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no Grupo'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
