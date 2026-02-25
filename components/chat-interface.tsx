'use client'

import { useState, useEffect, useRef } from 'react'
import { chatService } from '@/lib/services/chat-service'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Message } from '@/lib/types/database'
import Image from 'next/image'

interface ChatInterfaceProps {
  rideId: string
  otherUserName?: string
  otherUserAvatar?: string
}

export function ChatInterface({ rideId, otherUserName = 'Motorista', otherUserAvatar }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })

    // Load initial messages
    loadMessages()

    // Subscribe to new messages
    const unsubscribe = chatService.subscribeToChat(rideId, {
      onMessage: (message) => {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
      },
    })

    return () => {
      unsubscribe()
    }
  }, [rideId])

  const loadMessages = async () => {
    const result = await chatService.loadMessages(rideId)
    if (result.success && result.messages) {
      setMessages(result.messages)
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setLoading(true)
    const content = newMessage
    setNewMessage('')

    const result = await chatService.sendMessage({
      rideId,
      content,
      messageType: 'text',
    })

    if (!result.success) {
      console.error('[v0] Error sending message')
    }

    setLoading(false)
    scrollToBottom()
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          {otherUserAvatar ? (
            <Image src={otherUserAvatar} alt={otherUserName} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{otherUserName}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Online</p>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId
          return (
            <div
              key={message.id}
              className={`mb-3 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <span className="mt-1 text-xs text-neutral-400">
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-full border-neutral-200 dark:border-neutral-800"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || loading}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
