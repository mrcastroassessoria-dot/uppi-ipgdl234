import { iosToast } from './ios-toast'
import { triggerHaptic } from '@/hooks/use-haptic'

export interface ShareRideData {
  rideId: string
  pickupAddress: string
  dropoffAddress: string
  price?: number
  driverName?: string
}

export interface ShareCouponData {
  code: string
  discount: number
  description?: string
}

/**
 * Generate deep link URL for sharing a ride
 */
export function generateRideDeepLink(data: ShareRideData): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://uppi.app'
  const params = new URLSearchParams({
    type: 'ride',
    id: data.rideId,
    pickup: data.pickupAddress,
    dropoff: data.dropoffAddress,
    ...(data.price && { price: data.price.toString() }),
    ...(data.driverName && { driver: data.driverName }),
  })
  return `${baseUrl}/share?${params.toString()}`
}

/**
 * Generate deep link URL for sharing a coupon
 */
export function generateCouponDeepLink(data: ShareCouponData): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://uppi.app'
  const params = new URLSearchParams({
    type: 'coupon',
    code: data.code,
    discount: data.discount.toString(),
    ...(data.description && { desc: data.description }),
  })
  return `${baseUrl}/share?${params.toString()}`
}

/**
 * Share ride via native share API or clipboard fallback
 */
export async function shareRide(data: ShareRideData): Promise<boolean> {
  const link = generateRideDeepLink(data)
  const shareText = `🚗 Olha minha corrida no Uppi!\n\n📍 De: ${data.pickupAddress}\n📍 Para: ${data.dropoffAddress}${data.price ? `\n💰 R$ ${data.price.toFixed(2)}` : ''}\n\n${link}`

  triggerHaptic('impact')

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Minha corrida - Uppi',
        text: shareText,
        url: link,
      })
      return true
    } catch (error) {
      // User cancelled share or error occurred
      return false
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText)
      iosToast.success('Link copiado')
      triggerHaptic('success')
      return true
    } catch (error) {
      iosToast.error('Erro ao copiar link')
      triggerHaptic('error')
      return false
    }
  }
}

/**
 * Share coupon via native share API or clipboard fallback
 */
export async function shareCoupon(data: ShareCouponData): Promise<boolean> {
  const link = generateCouponDeepLink(data)
  const shareText = `🎁 Ganhe ${data.discount}% de desconto no Uppi!\n\nCodigo: ${data.code}\n${data.description || 'Use na sua proxima corrida'}\n\n${link}`

  triggerHaptic('impact')

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Cupom Uppi',
        text: shareText,
        url: link,
      })
      return true
    } catch (error) {
      return false
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareText)
      iosToast.success('Link copiado')
      triggerHaptic('success')
      return true
    } catch (error) {
      iosToast.error('Erro ao copiar link')
      triggerHaptic('error')
      return false
    }
  }
}

/**
 * Parse deep link parameters from URL
 */
export function parseDeepLink(url: string): { type: 'ride' | 'coupon'; data: any } | null {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    const type = params.get('type')

    if (type === 'ride') {
      return {
        type: 'ride',
        data: {
          rideId: params.get('id'),
          pickupAddress: params.get('pickup'),
          dropoffAddress: params.get('dropoff'),
          price: params.get('price') ? parseFloat(params.get('price')!) : undefined,
          driverName: params.get('driver') || undefined,
        },
      }
    }

    if (type === 'coupon') {
      return {
        type: 'coupon',
        data: {
          code: params.get('code'),
          discount: params.get('discount') ? parseInt(params.get('discount')!) : 0,
          description: params.get('desc') || undefined,
        },
      }
    }

    return null
  } catch (error) {
    console.error('[v0] Error parsing deep link:', error)
    return null
  }
}

/**
 * Handle incoming deep link
 */
export function handleDeepLink(url: string, router: any): void {
  const parsed = parseDeepLink(url)
  
  if (!parsed) {
    iosToast.error('Link invalido')
    return
  }

  triggerHaptic('impact')

  if (parsed.type === 'ride') {
    // Navigate to ride details or create similar ride
    const { rideId, pickupAddress, dropoffAddress } = parsed.data
    if (rideId) {
      router.push(`/uppi/ride/${rideId}/details`)
    } else if (pickupAddress && dropoffAddress) {
      router.push(`/uppi/request-ride?pickup=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(dropoffAddress)}`)
    }
    iosToast.success('Link aberto')
  } else if (parsed.type === 'coupon') {
    // Navigate to promotions page and auto-apply coupon
    const { code } = parsed.data
    router.push(`/uppi/promotions?code=${code}`)
    iosToast.success('Cupom recebido')
  }
}
