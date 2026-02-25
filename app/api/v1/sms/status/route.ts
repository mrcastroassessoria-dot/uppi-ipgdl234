import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/v1/sms/status
 * Webhook do Twilio para atualizar status de SMS enviados
 * 
 * Twilio envia callbacks para esta URL quando o status do SMS muda:
 * - queued: SMS na fila
 * - sent: SMS enviado ao provedor
 * - delivered: SMS entregue ao destinatário
 * - failed: Falha no envio
 * - undelivered: Não entregue
 * 
 * Docs: https://www.twilio.com/docs/sms/api/message-resource#message-status-values
 */
export async function POST(request: Request) {
  try {
    // Twilio envia form-urlencoded
    const formData = await request.formData()
    
    const messageSid = formData.get('MessageSid') as string
    const messageStatus = formData.get('MessageStatus') as string
    const errorCode = formData.get('ErrorCode') as string | null
    const errorMessage = formData.get('ErrorMessage') as string | null

    console.log('[v0] Twilio SMS status webhook:', {
      messageSid,
      messageStatus,
      errorCode,
      errorMessage,
    })

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: 'MessageSid e MessageStatus são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar admin client pois este é um webhook externo sem autenticação de usuário
    const supabase = await createClient()

    // Atualizar status no sms_logs
    const updateData: any = {
      status: messageStatus,
      updated_at: new Date().toISOString(),
    }

    if (messageStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    }

    if (errorCode) {
      updateData.error_code = errorCode
      updateData.error_message = errorMessage
    }

    const { data, error } = await supabase
      .from('sms_logs')
      .update(updateData)
      .eq('provider_message_id', messageSid)
      .select()
      .single()

    if (error) {
      console.error('[v0] SMS status update error:', error)
      // Não retornar erro 4xx para o Twilio, apenas logar
      // Twilio pode retentar se recebermos erro
      return NextResponse.json({ 
        warning: 'SMS log não encontrado ou erro ao atualizar',
        message_sid: messageSid,
      }, { status: 200 })
    }

    // Se temos um ride_id associado, podemos notificar o passageiro via Supabase Realtime
    if (data && data.metadata && data.metadata.ride_id) {
      const rideId = data.metadata.ride_id
      
      // Inserir notificação se o SMS foi entregue
      if (messageStatus === 'delivered') {
        await supabase.from('notifications').insert({
          user_id: data.to_number, // Assumindo que to_number é o user_id
          type: 'sms_delivered',
          title: 'SMS Entregue',
          message: `SMS da corrida ${rideId} foi entregue com sucesso`,
          metadata: { ride_id: rideId, message_sid: messageSid },
        })
      }

      // Se falhou, notificar também
      if (messageStatus === 'failed' || messageStatus === 'undelivered') {
        await supabase.from('notifications').insert({
          user_id: data.to_number,
          type: 'sms_failed',
          title: 'SMS Não Entregue',
          message: `Falha ao entregar SMS da corrida ${rideId}. Erro: ${errorMessage || 'Desconhecido'}`,
          metadata: { ride_id: rideId, message_sid: messageSid, error_code: errorCode },
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message_sid: messageSid,
      status: messageStatus,
    })
  } catch (error: any) {
    console.error('[v0] SMS status webhook error:', error)
    // Retornar 200 para evitar retries do Twilio em erros de parsing
    return NextResponse.json({ 
      error: 'Internal error processing webhook',
      details: error.message,
    }, { status: 200 })
  }
}

/**
 * GET /api/v1/sms/status
 * Verificar status de um SMS específico (não é webhook, é consulta manual)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const message_sid = searchParams.get('message_sid')
    const ride_id = searchParams.get('ride_id')

    if (!message_sid && !ride_id) {
      return NextResponse.json(
        { error: 'message_sid ou ride_id é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (message_sid) {
      query = query.eq('provider_message_id', message_sid)
    } else if (ride_id) {
      query = query.eq('metadata->>ride_id', ride_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] SMS logs fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ sms_logs: data || [] })
  } catch (error: any) {
    console.error('[v0] SMS status GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
