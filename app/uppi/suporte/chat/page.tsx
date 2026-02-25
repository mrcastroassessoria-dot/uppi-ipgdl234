'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

interface SupportMessage {
  id: string
  ticket_id: string
  sender_type: 'user' | 'agent' | 'system'
  sender_name: string | null
  message: string
  created_at: string
}

function SupportChatInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const topic = searchParams.get('topic') || 'other'

  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const topicLabels: Record<string, string> = {
    ride: 'Problema com corrida',
    payment: 'Pagamento',
    account: 'Minha conta',
    driver: 'Problema com motorista',
    safety: 'Seguranca',
    other: 'Outro assunto',
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Create or resume ticket
  useEffect(() => {
    async function initChat() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/onboarding/create-account')
        return
      }

      // Check for open ticket
      const { data: existing } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['open', 'waiting'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      let tid: string

      if (existing) {
        tid = existing.id
      } else {
        const { data: newTicket, error } = await supabase
          .from('support_tickets')
          .insert({ user_id: user.id, topic, status: 'open' })
          .select('id')
          .single()

        if (error || !newTicket) return
        tid = newTicket.id

        // System welcome message
        await supabase.from('support_messages').insert({
          ticket_id: tid,
          sender_type: 'system',
          sender_name: 'Uppi',
          message: `Bem-vindo ao suporte Uppi! Voce esta falando sobre: ${topicLabels[topic] || topic}. Um atendente ira responder em breve.`,
        })
      }

      setTicketId(tid)

      // Load existing messages
      const { data: msgs } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', tid)
        .order('created_at', { ascending: true })

      if (msgs) setMessages(msgs)

      // Simulate agent auto-reply for demo
      if (!existing) {
        setTimeout(() => {
          setTyping(true)
          setTimeout(async () => {
            await supabase.from('support_messages').insert({
              ticket_id: tid,
              sender_type: 'agent',
              sender_name: 'Ana - Suporte',
              message: `Ola! Sou a Ana do suporte Uppi. Vi que voce precisa de ajuda com "${topicLabels[topic]}". Me conta mais detalhes para eu poder te ajudar da melhor forma!`,
            })
            setTyping(false)
          }, 2500)
        }, 1500)
      }
    }

    initChat()
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return

    const channel = supabase
      .channel(`support-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, (payload) => {
        const newMsg = payload.new as SupportMessage
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ticketId, supabase])

  const handleSend = async () => {
    if (!input.trim() || sending || !ticketId) return
    const text = input.trim()
    setInput('')
    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_type: 'user',
        sender_id: user?.id,
        sender_name: 'Voce',
        message: text,
      })

      // Simulate agent typing reply
      setTimeout(() => {
        setTyping(true)
        setTimeout(async () => {
          const replies = [
            'Entendi! Vou verificar isso para voce agora mesmo.',
            'Obrigado por explicar. Estou analisando o seu caso.',
            'Ja estou cuidando disso! Um momento, por favor.',
            'Perfeito, vou resolver isso rapidamente para voce.',
            'Compreendo a situacao. Deixa comigo!',
          ]
          await supabase.from('support_messages').insert({
            ticket_id: ticketId,
            sender_type: 'agent',
            sender_name: 'Ana - Suporte',
            message: replies[Math.floor(Math.random() * replies.length)],
          })
          setTyping(false)
        }, 2000 + Math.random() * 2000)
      }, 800)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card/80 ios-blur border-b border-border/40 sticky top-0 z-30">
        <div className="px-4 pt-safe-offset-4 pb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center ios-press shrink-0"
            aria-label="Voltar"
          >
            <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" />
            </div>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-foreground truncate">Suporte Uppi</p>
              <p className="text-[12px] text-emerald-500 font-medium">Online agora</p>
            </div>
          </div>
          <button
            type="button"
            className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center ios-press shrink-0"
          >
            <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 ios-scroll">
        {messages.length === 0 && !typing && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-foreground">Conectando ao suporte...</p>
            <p className="text-[13px] text-muted-foreground mt-1">Aguarde um momento</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {messages.map((msg, i) => {
            const isUser = msg.sender_type === 'user'
            const isSystem = msg.sender_type === 'system'
            const prevMsg = messages[i - 1]
            const showName = !isUser && !isSystem && prevMsg?.sender_type !== msg.sender_type
            const showTime = !messages[i + 1] || messages[i + 1]?.sender_type !== msg.sender_type

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-3 animate-ios-fade-up">
                  <div className="bg-secondary/80 ios-blur px-4 py-2 rounded-full max-w-[85%]">
                    <p className="text-[12px] text-muted-foreground text-center leading-snug">{msg.message}</p>
                  </div>
                </div>
              )
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-ios-fade-up`}>
                {showName && (
                  <p className="text-[11px] font-semibold text-muted-foreground ml-3 mb-0.5">{msg.sender_name}</p>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 ${
                    isUser
                      ? 'bg-blue-500 text-white rounded-[18px] rounded-br-[6px]'
                      : 'bg-secondary text-foreground rounded-[18px] rounded-bl-[6px]'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.message}</p>
                </div>
                {showTime && (
                  <p className={`text-[10px] text-muted-foreground/60 mt-0.5 ${isUser ? 'mr-1' : 'ml-1'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                )}
              </div>
            )
          })}

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-start animate-ios-fade-up">
              <div className="bg-secondary rounded-[18px] rounded-bl-[6px] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto ios-scroll">
          {['Preciso de ajuda urgente', 'Quero um reembolso', 'Reportar problema'].map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => { setInput(text); inputRef.current?.focus() }}
              className="shrink-0 px-3.5 py-2 bg-secondary rounded-full text-[13px] font-medium text-foreground ios-press whitespace-nowrap"
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="bg-card/80 ios-blur border-t border-border/40 px-4 pb-safe-offset-2 pt-2">
        <div className="flex items-end gap-2.5">
          <button type="button" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 ios-press mb-0.5">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex-1 bg-secondary rounded-[22px] flex items-end">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Mensagem..."
              className="flex-1 bg-transparent px-4 py-2.5 text-[16px] text-foreground placeholder:text-muted-foreground outline-none min-h-[40px]"
              disabled={sending}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-150 ${
              input.trim()
                ? 'bg-blue-500 text-white scale-100 ios-press'
                : 'bg-secondary text-muted-foreground/40 scale-90'
            }`}
            aria-label="Enviar"
          >
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SupportChatPage() {
  return (
    <Suspense fallback={
      <div className="h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-[2.5px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SupportChatInner />
    </Suspense>
  )
}
