import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { apiLimiter, rateLimitResponse } from '@/lib/utils/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rlResult = apiLimiter.check(request, 30)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('social_post_likes')
      .insert({
        post_id: params.id,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already liked' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ like: data })
  } catch (error) {
    console.error('[v0] Error liking post:', error)
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rlResult = apiLimiter.check(request, 30)
    if (!rlResult.success) return rateLimitResponse(rlResult)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('social_post_likes')
      .delete()
      .eq('post_id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error unliking post:', error)
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 })
  }
}
