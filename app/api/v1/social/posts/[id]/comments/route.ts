import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter } from '@/lib/utils/rate-limit'

/**
 * GET /api/v1/social/posts/[id]/comments
 * Buscar comentários de um post
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const { success } = await apiLimiter.check(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Buscar comentários com informações do autor
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:profiles!post_comments_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[v0] Comments fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Buscar contagem total de comentários
    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id)

    return NextResponse.json({
      comments: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('[v0] Comments GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/v1/social/posts/[id]/comments
 * Adicionar comentário em um post
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const { success } = await apiLimiter.check(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    // Validação
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Comentário não pode ter mais de 500 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o post existe
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    // Criar comentário
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        author:profiles!post_comments_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (commentError) {
      console.error('[v0] Comment insert error:', commentError)
      return NextResponse.json({ error: commentError.message }, { status: 400 })
    }

    // Incrementar contador de comentários no post
    const { error: updateError } = await supabase.rpc('increment_comment_count', {
      p_post_id: id,
    })

    if (updateError) {
      console.error('[v0] Comment count increment error:', updateError)
      // Fallback: atualizar manualmente
      await supabase
        .from('social_posts')
        .update({ comments_count: supabase.raw('comments_count + 1') })
        .eq('id', id)
    }

    // Se não é o próprio autor do post, criar notificação
    if (post.user_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'post_comment',
        title: 'Novo Comentário',
        message: `${comment.author?.full_name || 'Alguém'} comentou no seu post`,
        metadata: {
          post_id: id,
          comment_id: comment.id,
          commenter_id: user.id,
        },
      })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Comment creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/social/posts/[id]/comments?comment_id=xxx
 * Deletar um comentário (apenas autor ou admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Rate limiting
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'
    const { success } = await apiLimiter.check(identifier)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comment_id = searchParams.get('comment_id')

    if (!comment_id) {
      return NextResponse.json(
        { error: 'comment_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar comentário para verificar ownership
    const { data: comment, error: fetchError } = await supabase
      .from('post_comments')
      .select('user_id, post_id')
      .eq('id', comment_id)
      .eq('post_id', id)
      .single()

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 })
    }

    // Verificar se é o autor do comentário
    if (comment.user_id !== user.id) {
      // Verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.is_admin) {
        return NextResponse.json(
          { error: 'Apenas o autor ou admin pode deletar este comentário' },
          { status: 403 }
        )
      }
    }

    // Deletar comentário
    const { error: deleteError } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', comment_id)

    if (deleteError) {
      console.error('[v0] Comment delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // Decrementar contador de comentários
    await supabase.rpc('decrement_comment_count', {
      p_post_id: id,
    })

    return NextResponse.json({ success: true, deleted_id: comment_id })
  } catch (error: any) {
    console.error('[v0] Comment deletion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
