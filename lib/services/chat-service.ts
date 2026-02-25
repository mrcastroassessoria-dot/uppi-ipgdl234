import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types/database'

export interface SendMessageParams {
  rideId: string
  content: string
  messageType?: 'text' | 'location' | 'image' | 'voice'
}

export interface ChatSubscriptionCallback {
  onMessage: (message: Message) => void
  onTyping?: (userId: string, isTyping: boolean) => void
}

class ChatService {
  private supabase = createClient()
  private subscriptions: Map<string, any> = new Map()

  async sendMessage(params: SendMessageParams) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
      }

      const { data: message, error } = await this.supabase
        .from('messages')
        .insert({
          ride_id: params.rideId,
          sender_id: user.id,
          content: params.content,
          message_type: params.messageType || 'text',
          is_read: false,
        })
        .select()
        .single()

      if (error) {
        console.error('[v0] Error sending message:', error)
        return { success: false, error: error.message }
      }

      return { success: true, message }
    } catch (error) {
      console.error('[v0] Chat service error:', error)
      return { success: false, error: 'Erro ao enviar mensagem' }
    }
  }

  async loadMessages(rideId: string) {
    try {
      const { data: messages, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[v0] Error loading messages:', error)
        return { success: false, error: error.message, messages: [] }
      }

      return { success: true, messages: messages || [] }
    } catch (error) {
      console.error('[v0] Chat service error:', error)
      return { success: false, error: 'Erro ao carregar mensagens', messages: [] }
    }
  }

  async markAsRead(messageIds: string[]) {
    try {
      const { error } = await this.supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds)

      if (error) {
        console.error('[v0] Error marking messages as read:', error)
        return { success: false }
      }

      return { success: true }
    } catch (error) {
      console.error('[v0] Chat service error:', error)
      return { success: false }
    }
  }

  subscribeToChat(rideId: string, callbacks: ChatSubscriptionCallback) {
    const channelName = `chat:${rideId}`
    
    // Unsubscribe if already exists
    if (this.subscriptions.has(channelName)) {
      this.unsubscribeFromChat(rideId)
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ride_id=eq.${rideId}`,
        },
        async (payload) => {
          console.log('[v0] New message received:', payload.new)
          
          // Load sender info
          const { data: sender } = await this.supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', (payload.new as any).sender_id)
            .single()

          const message = {
            ...payload.new,
            sender,
          } as Message

          callbacks.onMessage(message)
        }
      )
      .subscribe()

    this.subscriptions.set(channelName, channel)

    console.log('[v0] Subscribed to chat:', channelName)

    return () => this.unsubscribeFromChat(rideId)
  }

  unsubscribeFromChat(rideId: string) {
    const channelName = `chat:${rideId}`
    const channel = this.subscriptions.get(channelName)

    if (channel) {
      this.supabase.removeChannel(channel)
      this.subscriptions.delete(channelName)
      console.log('[v0] Unsubscribed from chat:', channelName)
    }
  }

  async sendTypingIndicator(rideId: string, isTyping: boolean) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return

      // Broadcast typing status via Realtime
      const channel = this.supabase.channel(`typing:${rideId}`)
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          isTyping,
        },
      })
    } catch (error) {
      console.error('[v0] Error sending typing indicator:', error)
    }
  }

  cleanup() {
    this.subscriptions.forEach((channel) => {
      this.supabase.removeChannel(channel)
    })
    this.subscriptions.clear()
  }
}

export const chatService = new ChatService()
