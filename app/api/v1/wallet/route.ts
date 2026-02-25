import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Get wallet transactions
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Get current balance from last transaction
    const balance = transactions && transactions.length > 0 
      ? transactions[0].balance_after 
      : 0

    return NextResponse.json({ 
      success: true,
      transactions: transactions || [], 
      balance 
    })
  } catch (error) {
    console.error('[v0] Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transacoes' },
      { status: 500 }
    )
  }
}

// POST - Add transaction
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, description, reference_id, reference_type } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor invalido' }, { status: 400 })
    }

    const validTypes = ['ride', 'refund', 'bonus', 'cashback', 'referral', 'subscription', 'withdrawal', 'deposit']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 })
    }

    // Get current balance
    const { data: lastTransaction } = await supabase
      .from('wallet_transactions')
      .select('balance_after')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const currentBalance = lastTransaction?.balance_after || 0
    const newBalance = currentBalance + amount

    // Create transaction
    const { data: transaction, error } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount,
        type,
        balance_after: newBalance,
        description: description || `Transação ${type}`,
        reference_id,
        reference_type,
        metadata: {}
      })
      .select()
      .single()

    if (error) throw error

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: amount > 0 ? 'Crédito adicionado' : 'Débito realizado',
      body: `R$ ${Math.abs(amount).toFixed(2)} ${amount > 0 ? 'adicionado à' : 'debitado da'} sua carteira`,
      data: { transaction_id: transaction.id },
      is_read: false
    })

    return NextResponse.json({ success: true, transaction, new_balance: newBalance })
  } catch (error) {
    console.error('[v0] Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Erro ao processar transacao' },
      { status: 500 }
    )
  }
}
