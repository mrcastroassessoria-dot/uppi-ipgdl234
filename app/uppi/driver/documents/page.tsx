'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomNavigation } from '@/components/bottom-navigation'
import { iosToast } from '@/lib/utils/ios-toast'
import { triggerHaptic } from '@/hooks/use-haptic'
import { driverRegisterSchema, validateForm } from '@/lib/validations/schemas'

export default function DriverDocumentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [documents, setDocuments] = useState<any>(null)
  const [formData, setFormData] = useState({
    vehicle_type: 'economy',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_plate: '',
    vehicle_color: '',
    license_number: '',
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/v1/driver/documents')
      const data = await response.json()
      setDocuments(data)
      
      if (data) {
        setFormData({
          vehicle_type: data.vehicle_type || 'economy',
          vehicle_brand: data.vehicle_brand || '',
          vehicle_model: data.vehicle_model || '',
          vehicle_year: data.vehicle_year || '',
          vehicle_plate: data.vehicle_plate || '',
          vehicle_color: data.vehicle_color || '',
          license_number: data.license_number || '',
        })
      }
    } catch (error) {
      console.error('[v0] Error loading documents:', error)
      iosToast.error('Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateForm(driverRegisterSchema, formData)
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]
      iosToast.error(firstError || 'Preencha os campos corretamente')
      return
    }

    setSaving(true)
    triggerHaptic('impact')

    try {
      const response = await fetch('/api/v1/driver/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Erro ao salvar')

      triggerHaptic('success')
      iosToast.success('Documentos enviados para analise')
      loadDocuments()
    } catch (error) {
      console.error('[v0] Error saving documents:', error)
      triggerHaptic('error')
      iosToast.error('Erro ao salvar documentos')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-20">
      <header className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="hover:bg-blue-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold text-blue-900">Documentos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        {documents?.is_verified !== undefined && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                documents.is_verified ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'
              }`}>
                {documents.is_verified ? 'Verificado' : 'Aguardando verificação'}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Informações do Veículo</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
              <select
                id="vehicle_type"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="economy">Econômico</option>
                <option value="electric">Eletrico</option>
                <option value="premium">Premium</option>
                <option value="suv">SUV</option>
                <option value="moto">Moto</option>
              </select>
            </div>

            <div>
              <Label htmlFor="vehicle_brand">Marca</Label>
              <Input
                id="vehicle_brand"
                value={formData.vehicle_brand}
                onChange={(e) => setFormData({ ...formData, vehicle_brand: e.target.value })}
                placeholder="Ex: Fiat, Volkswagen"
                required
              />
            </div>

            <div>
              <Label htmlFor="vehicle_model">Modelo</Label>
              <Input
                id="vehicle_model"
                value={formData.vehicle_model}
                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                placeholder="Ex: Uno, Gol"
                required
              />
            </div>

            <div>
              <Label htmlFor="vehicle_year">Ano</Label>
              <Input
                id="vehicle_year"
                value={formData.vehicle_year}
                onChange={(e) => setFormData({ ...formData, vehicle_year: e.target.value })}
                placeholder="Ex: 2020"
                required
              />
            </div>

            <div>
              <Label htmlFor="vehicle_plate">Placa</Label>
              <Input
                id="vehicle_plate"
                value={formData.vehicle_plate}
                onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
                placeholder="Ex: ABC1234"
                required
              />
            </div>

            <div>
              <Label htmlFor="vehicle_color">Cor</Label>
              <Input
                id="vehicle_color"
                value={formData.vehicle_color}
                onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                placeholder="Ex: Branco, Preto, Prata"
                required
              />
            </div>

            <div>
              <Label htmlFor="license_number">CNH</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="Número da CNH"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? 'Salvando...' : 'Enviar Documentos'}
            </Button>
          </form>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  )
}
