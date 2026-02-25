'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { realtimeService } from '@/lib/services/realtime-service'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Heart, MessageCircle, Share2, TrendingUp, Award, MapPin, Users } from 'lucide-react'
import { useHaptic } from '@/hooks/use-haptic'
import { iosToast } from '@/lib/utils/ios-toast'
import SocialSkeleton from '@/components/social-skeleton'
import { EmptyState } from '@/components/empty-state'

interface SocialPost {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  type: string
  title: string
  description: string | null
  metadata: any
  likes_count: number
  comments_count: number
  has_liked: boolean
  created_at: string
}

export default function SocialFeedPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const haptic = useHaptic()
  const supabase = createClient()

  useEffect(() => {
    loadFeed()
    
    // Subscribe to new posts in real-time
    console.log('[v0] Setting up social feed realtime subscription')
    
    const postsChannel = realtimeService.subscribeToTable(
      'social_posts',
      (payload) => {
        if (payload.eventType === 'INSERT') {
          console.log('[v0] New social post:', payload.new)
          loadFeed() // Reload feed to get the new post with all data
        }
      }
    )
    
    return () => {
      console.log('[v0] Cleaning up social feed subscription')
      realtimeService.unsubscribe(postsChannel)
    }
  }, [])

  const loadFeed = async () => {
    try {
      const res = await fetch('/api/v1/social/posts?limit=50')
      if (!res.ok) throw new Error('Failed to load feed')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('[v0] Error loading feed:', error)
      iosToast.error('Erro ao carregar feed')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string, hasLiked: boolean) => {
    haptic.impact('medium')
    
    // Optimistic update
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, has_liked: !hasLiked, likes_count: p.likes_count + (hasLiked ? -1 : 1) }
        : p
    ))

    try {
      const method = hasLiked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/v1/social/posts/${postId}/like`, { method })
      if (!res.ok) throw new Error('Failed to toggle like')
    } catch (error) {
      console.error('[v0] Error toggling like:', error)
      iosToast.error('Erro ao curtir')
      // Revert optimistic update
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, has_liked: hasLiked, likes_count: p.likes_count + (hasLiked ? 1 : -1) }
          : p
      ))
    }
  }

  const handleShare = async (post: SocialPost) => {
    haptic.impact('medium')
    
    const shareText = `${post.title}\n\nCompartilhado via Uppi`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: shareText,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText)
        iosToast.success('Link copiado!')
      } catch (error) {
        iosToast.error('Erro ao copiar')
      }
    }
  }

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'savings_shared': return <TrendingUp className="w-5 h-5 text-emerald-500" />
      case 'achievement_unlocked': return <Award className="w-5 h-5 text-amber-500" />
      case 'milestone_reached': return <Award className="w-5 h-5 text-blue-500" />
      case 'ride_completed': return <MapPin className="w-5 h-5 text-purple-500" />
      default: return <Users className="w-5 h-5 text-gray-500" />
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return <SocialSkeleton />
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header */}
      <div className="safe-top bg-card/[0.92] ios-blur border-b border-border/50 z-20">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center ios-press"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold">Feed Social</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border/50">
          {posts.map((post, index) => (
            <div 
              key={post.id}
              className="p-4 bg-card animate-ios-fade-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* User header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {post.user_avatar ? (
                    <Image src={post.user_avatar || "/placeholder.svg"} alt={`Avatar de ${post.user_name}`} width={40} height={40} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    post.user_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[15px]">{post.user_name || 'Usuário'}</div>
                  <div className="text-[13px] text-muted-foreground">{getRelativeTime(post.created_at)}</div>
                </div>
                {getPostIcon(post.type)}
              </div>

              {/* Content */}
              <div className="mb-3">
                <h3 className="font-bold text-[16px] mb-1">{post.title}</h3>
                {post.description && (
                  <p className="text-[14px] text-muted-foreground">{post.description}</p>
                )}
                
                {/* Metadata card */}
                {post.type === 'savings_shared' && post.metadata?.amount && (
                  <div className="mt-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[20px]">
                      R$ {post.metadata.amount.toFixed(2)}
                    </div>
                    <div className="text-[13px] text-emerald-600/70 dark:text-emerald-400/70">
                      economizados em {post.metadata.ride_count || 1} corrida{post.metadata.ride_count > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => handleLike(post.id, post.has_liked)}
                  className="flex items-center gap-1.5 ios-press"
                >
                  <Heart 
                    className={`w-5 h-5 ${post.has_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                  />
                  <span className={`text-[14px] font-semibold ${post.has_liked ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {post.likes_count}
                  </span>
                </button>

                <button className="flex items-center gap-1.5 ios-press">
                  <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[14px] font-semibold text-muted-foreground">
                    {post.comments_count}
                  </span>
                </button>

                <button
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-1.5 ios-press ml-auto"
                >
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <EmptyState 
              preset="social"
              title="Feed vazio"
              description="Complete corridas para ver conquistas e economia"
            />
          )}
        </div>
      </div>

      {/* Create Post FAB */}
      <button
        onClick={() => router.push('/uppi/social/create')}
        className="fixed bottom-20 right-6 w-14 h-14 bg-blue-500 rounded-full shadow-[0_4px_20px_rgba(59,130,246,0.4)] flex items-center justify-center ios-press"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
