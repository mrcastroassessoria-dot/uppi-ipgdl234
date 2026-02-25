'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { iosToast } from '@/lib/utils/ios-toast'

interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  secret: string
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
}

export default function WebhooksPage() {
  const router = useRouter()
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const availableEvents = [
    { value: 'ride.created', label: 'Corrida Criada' },
    { value: 'ride.status_changed', label: 'Status da Corrida Mudou' },
    { value: 'ride.cancelled', label: 'Corrida Cancelada' },
    { value: 'payment.INSERT', label: 'Pagamento Criado' },
    { value: 'payment.UPDATE', label: 'Pagamento Atualizado' },
  ]

  useEffect(() => {
    fetchEndpoints()
  }, [])

  const fetchEndpoints = async () => {
    try {
      const res = await fetch('/api/v1/webhooks')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setEndpoints(data.endpoints || [])
    } catch (error) {
      iosToast.error('Erro ao carregar webhooks')
    } finally {
      setLoading(false)
    }
  }

  const createEndpoint = async () => {
    if (!newUrl || selectedEvents.length === 0) {
      iosToast.error('Preencha URL e selecione eventos')
      return
    }

    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, events: selectedEvents }),
      })

      if (!res.ok) throw new Error('Failed to create')
      
      iosToast.success('Webhook criado com sucesso')
      setShowCreateModal(false)
      setNewUrl('')
      setSelectedEvents([])
      fetchEndpoints()
    } catch (error) {
      iosToast.error('Erro ao criar webhook')
    }
  }

  const deleteEndpoint = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/webhooks?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      
      iosToast.success('Webhook removido')
      fetchEndpoints()
    } catch (error) {
      iosToast.error('Erro ao remover webhook')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 ios-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="ios-press">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Webhooks</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold ios-press flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Webhook
          </button>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {endpoints.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum webhook configurado
          </div>
        ) : (
          endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="bg-card rounded-2xl p-6 border border-border space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {endpoint.is_active ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-mono text-sm">{endpoint.url}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {endpoint.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 bg-secondary rounded-lg text-xs font-medium"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteEndpoint(endpoint.id)}
                  className="text-red-500 ios-press"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Último trigger:{' '}
                  {endpoint.last_triggered_at
                    ? new Date(endpoint.last_triggered_at).toLocaleString('pt-BR')
                    : 'Nunca'}
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Secret (HMAC):</div>
                <code className="text-xs font-mono">{endpoint.secret}</code>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 animate-ios-modal-up">
            <h2 className="text-xl font-bold mb-4">Criar Webhook</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL do Endpoint</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://api.example.com/webhooks"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Eventos</label>
                <div className="space-y-2">
                  {availableEvents.map((event) => (
                    <label key={event.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, event.value])
                          } else {
                            setSelectedEvents(selectedEvents.filter((ev) => ev !== event.value))
                          }
                        }}
                        className="w-5 h-5 rounded border-border"
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl border border-border font-semibold ios-press"
              >
                Cancelar
              </button>
              <button
                onClick={createEndpoint}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold ios-press"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
