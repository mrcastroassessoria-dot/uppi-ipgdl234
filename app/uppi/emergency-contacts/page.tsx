'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNavigation } from '@/components/bottom-navigation'
import { iosToast } from '@/lib/utils/ios-toast'
import { emergencyContactSchema, validateForm } from '@/lib/validations/schemas'
import { IOSConfirmDialog } from '@/components/ios-confirm-dialog'

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

export default function EmergencyContactsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', relationship: '' })
  const [saving, setSaving] = useState(false)
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/onboarding/splash')
        return
      }

      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('[v0] Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const validation = validateForm(emergencyContactSchema, formData)
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0]
      iosToast.error(firstError || 'Preencha os campos corretamente')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship || null
        })
        .select()
        .single()

      if (error) throw error

      setContacts([data, ...contacts])
      setFormData({ name: '', phone: '', relationship: '' })
      setShowForm(false)
      iosToast.success('Contato salvo')
    } catch (error) {
      console.error('[v0] Error saving contact:', error)
      iosToast.error('Erro ao salvar contato')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteContactId) return
    const contactId = deleteContactId
    setDeleteContactId(null)

    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      setContacts(contacts.filter(c => c.id !== contactId))
      iosToast.success('Contato removido')
    } catch (error) {
      console.error('[v0] Error deleting contact:', error)
      iosToast.error('Erro ao deletar contato')
    }
  }

  if (loading) {
    return (
      <div className="h-dvh bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-[2.5px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-dvh overflow-y-auto bg-neutral-50 pb-24 ios-scroll">
      {/* Header - iOS style */}
      <header className="bg-white/95 ios-blur border-b border-neutral-200/60 sticky top-0 z-30">
        <div className="px-5 pt-safe-offset-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full ios-press">
                <svg className="w-[22px] h-[22px] text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-[20px] font-bold text-neutral-900 tracking-tight">Contatos de Emergencia</h1>
            </div>
            {!showForm && (
              <button type="button" onClick={() => setShowForm(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 ios-press shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 py-5 max-w-2xl mx-auto space-y-5 animate-ios-fade-up">
        {/* Info */}
        <div className="bg-blue-50 rounded-[18px] p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[14px] text-blue-700 leading-relaxed">
            Estes contatos serao notificados em caso de emergencia durante uma corrida.
          </p>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-ios-fade-up">
            <h3 className="text-[17px] font-bold text-neutral-900 mb-4">Novo Contato</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-[48px] px-4 bg-neutral-100/80 rounded-[14px] text-[17px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-500/30 ios-smooth"
              />
              <input
                type="tel"
                placeholder="Telefone com DDD"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-[48px] px-4 bg-neutral-100/80 rounded-[14px] text-[17px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-500/30 ios-smooth"
              />
              <input
                type="text"
                placeholder="Relacionamento (ex: Mae, Amigo)"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full h-[48px] px-4 bg-neutral-100/80 rounded-[14px] text-[17px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-blue-500/30 ios-smooth"
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-[48px] rounded-[14px] bg-blue-500 text-white font-semibold text-[17px] ios-press shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormData({ name: '', phone: '', relationship: '' }) }}
                  className="flex-1 h-[48px] rounded-[14px] bg-neutral-100 text-neutral-700 font-semibold text-[17px] ios-press"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contacts List */}
        {contacts.length > 0 ? (
          <div>
            <p className="ios-section-header">Seus Contatos</p>
            <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              {contacts.map((contact, i) => (
                <div key={contact.id} className={`px-5 py-4 flex items-center gap-3.5 ${i < contacts.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                  <div className="w-11 h-11 bg-red-50 rounded-[14px] flex items-center justify-center flex-shrink-0">
                    <svg className="w-[22px] h-[22px] text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-medium text-neutral-900 truncate">{contact.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[13px] text-neutral-500">{contact.phone}</p>
                      {contact.relationship && (
                        <>
                          <span className="text-[13px] text-neutral-300">|</span>
                          <p className="text-[13px] text-neutral-400">{contact.relationship}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteContactId(contact.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 ios-press"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : !showForm ? (
          <div className="bg-white rounded-[20px] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="w-20 h-20 bg-neutral-100 rounded-[22px] flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-neutral-900 tracking-tight mb-1.5">Nenhum contato</h2>
            <p className="text-[15px] text-neutral-500 mb-5 max-w-[260px] mx-auto">Adicione contatos de emergencia para serem notificados em caso de perigo.</p>
            <button type="button" onClick={() => setShowForm(true)} className="h-[48px] px-6 rounded-[14px] bg-blue-500 text-white font-semibold text-[17px] ios-press shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
              Adicionar Contato
            </button>
          </div>
        ) : null}
      </main>

      <BottomNavigation />
      
      <IOSConfirmDialog
        isOpen={deleteContactId !== null}
        onClose={() => setDeleteContactId(null)}
        onConfirm={handleDelete}
        title="Remover contato?"
        description="Este contato de emergencia sera excluido permanentemente."
        confirmText="Sim, remover"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
