'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/use-haptic'

interface FacialVerificationProps {
  onVerified: (imageData: string) => void
  onCancel?: () => void
  driverName?: string
}

type VerificationStatus = 'idle' | 'detecting' | 'aligning' | 'captured' | 'verifying' | 'success' | 'error'

const STATUS_MESSAGES: Record<VerificationStatus, string> = {
  idle: 'Iniciando camera...',
  detecting: 'Posicione seu rosto no centro',
  aligning: 'Mantenha o rosto parado...',
  captured: 'Foto capturada',
  verifying: 'Verificando identidade...',
  success: 'Verificado com sucesso',
  error: 'Erro na verificacao',
}

export function FacialVerification({ onVerified, onCancel, driverName }: FacialVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [alignmentProgress, setAlignmentProgress] = useState(0)
  const [scanLineY, setScanLineY] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>()
  const alignmentTimerRef = useRef<ReturnType<typeof setInterval>>()
  const haptic = useHaptic()

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (alignmentTimerRef.current) {
      clearInterval(alignmentTimerRef.current)
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setStatus('detecting')

      // Simulate face detection with progressive alignment
      let frameCount = 0
      const detect = () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          frameCount++
          // Scan line animation
          setScanLineY((frameCount % 120) / 120 * 100)

          // Face detected after ~1.5s
          if (frameCount > 45 && !faceDetected) {
            setFaceDetected(true)
            haptic.light()
            setStatus('aligning')

            // Start alignment progress
            let progress = 0
            alignmentTimerRef.current = setInterval(() => {
              progress += 2
              setAlignmentProgress(Math.min(progress, 100))
              if (progress >= 100) {
                clearInterval(alignmentTimerRef.current)
                haptic.success()
              }
            }, 40)
          }
        }
        animationRef.current = requestAnimationFrame(detect)
      }

      detect()
    } catch {
      setStatus('error')
      setErrorMessage('Nao foi possivel acessar a camera. Verifique as permissoes.')
    }
  }, [faceDetected, haptic])

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    haptic.medium()

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedImage(imageData)
    setStatus('captured')
    stopCamera()
  }, [haptic, stopCamera])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    setFaceDetected(false)
    setAlignmentProgress(0)
    setStatus('idle')
    startCamera()
  }, [startCamera])

  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return
    haptic.medium()
    setStatus('verifying')

    // Simulate AI verification
    await new Promise(resolve => setTimeout(resolve, 2500))

    setStatus('success')
    haptic.success()

    setTimeout(() => {
      onVerified(capturedImage)
    }, 1200)
  }, [capturedImage, haptic, onVerified])

  const progressDash = 2 * Math.PI * 62
  const progressOffset = progressDash - (progressDash * alignmentProgress) / 100

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* iOS Status Bar Area */}
      <div className="pt-safe-offset-4" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        {onCancel ? (
          <button
            type="button"
            onClick={() => { haptic.light(); onCancel() }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ios-press"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : <div className="w-10" />}

        <div className="text-center">
          <h1 className="text-[17px] font-semibold text-white">Verificacao Facial</h1>
          <p className="text-[13px] text-white/50 mt-0.5">Confirme sua identidade</p>
        </div>

        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Camera / Preview Area */}
        <div className="relative w-[280px] h-[280px] mb-8">
          {/* Outer ring glow */}
          <div className={cn(
            'absolute -inset-4 rounded-full transition-all duration-1000',
            faceDetected ? 'bg-emerald-500/10' : 'bg-blue-500/5'
          )} />

          {/* SVG Progress Ring */}
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90" viewBox="0 0 136 136">
            {/* Background ring */}
            <circle cx="68" cy="68" r="62" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            {/* Progress ring */}
            <circle
              cx="68" cy="68" r="62"
              fill="none"
              stroke={alignmentProgress >= 100 ? '#10b981' : '#3b82f6'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={progressDash}
              strokeDashoffset={progressOffset}
              className="transition-all duration-200"
            />
          </svg>

          {/* Circular clip mask for camera */}
          <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover scale-x-[-1]"
                  playsInline
                  muted
                  autoPlay
                />
                {/* Scan line */}
                {status === 'detecting' && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-blue-400/60"
                    style={{ top: `${scanLineY}%`, transition: 'top 33ms linear' }}
                  />
                )}
                {/* Grid overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
                </div>
              </>
            ) : (
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Foto capturada"
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {/* Verifying overlay */}
            {status === 'verifying' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-ios-fade-up">
                <div className="w-14 h-14 border-[3px] border-white/20 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            )}

            {/* Success overlay */}
            {status === 'success' && (
              <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center animate-ios-bounce-in">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Corner indicators */}
          {!capturedImage && status !== 'success' && (
            <>
              <div className={cn(
                'absolute -top-1 -left-1 w-6 h-6 border-t-[3px] border-l-[3px] rounded-tl-[8px] transition-colors duration-500',
                faceDetected ? 'border-emerald-400' : 'border-white/30'
              )} />
              <div className={cn(
                'absolute -top-1 -right-1 w-6 h-6 border-t-[3px] border-r-[3px] rounded-tr-[8px] transition-colors duration-500',
                faceDetected ? 'border-emerald-400' : 'border-white/30'
              )} />
              <div className={cn(
                'absolute -bottom-1 -left-1 w-6 h-6 border-b-[3px] border-l-[3px] rounded-bl-[8px] transition-colors duration-500',
                faceDetected ? 'border-emerald-400' : 'border-white/30'
              )} />
              <div className={cn(
                'absolute -bottom-1 -right-1 w-6 h-6 border-b-[3px] border-r-[3px] rounded-br-[8px] transition-colors duration-500',
                faceDetected ? 'border-emerald-400' : 'border-white/30'
              )} />
            </>
          )}
        </div>

        {/* Status Message */}
        <div className="text-center mb-2 animate-ios-fade-up">
          {driverName && status === 'detecting' && (
            <p className="text-[15px] text-white/60 mb-1">
              {'Ola, '}{driverName.split(' ')[0]}
            </p>
          )}
          <div className="inline-flex items-center gap-2.5 bg-white/[0.08] ios-blur-heavy rounded-full px-5 py-2.5">
            {status === 'detecting' && (
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
            {status === 'aligning' && (
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            {(status === 'captured' || status === 'verifying') && (
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            )}
            {status === 'success' && (
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
            {status === 'error' && (
              <div className="w-2 h-2 rounded-full bg-red-400" />
            )}
            <p className={cn(
              'text-[14px] font-semibold',
              status === 'success' ? 'text-emerald-400' :
              status === 'error' ? 'text-red-400' :
              'text-white'
            )}>
              {status === 'error' ? errorMessage : STATUS_MESSAGES[status]}
            </p>
          </div>
        </div>

        {/* Alignment meter */}
        {(status === 'aligning' || (status === 'detecting' && faceDetected)) && (
          <div className="w-48 mt-4 animate-ios-fade-up">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${alignmentProgress}%`,
                  background: alignmentProgress >= 100
                    ? '#10b981'
                    : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                }}
              />
            </div>
            <p className="text-[12px] text-white/40 text-center mt-2">
              {alignmentProgress >= 100 ? 'Pronto para capturar' : 'Alinhando...'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-6 pb-safe-offset-4">
        {/* Capture button */}
        {!capturedImage && status !== 'error' && (
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={alignmentProgress < 100}
              className={cn(
                'w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 ios-press',
                alignmentProgress >= 100
                  ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                  : 'bg-white/20'
              )}
            >
              <div className={cn(
                'w-[60px] h-[60px] rounded-full border-[3px] transition-colors',
                alignmentProgress >= 100 ? 'border-black/10' : 'border-white/20'
              )} />
            </button>
            <p className="text-[13px] text-white/40">
              {alignmentProgress >= 100 ? 'Toque para capturar' : 'Aguardando alinhamento...'}
            </p>
          </div>
        )}

        {/* Captured actions */}
        {capturedImage && status === 'captured' && (
          <div className="flex gap-3 animate-ios-fade-up">
            <button
              type="button"
              onClick={retakePhoto}
              className="flex-1 h-[52px] rounded-[16px] bg-white/10 text-white font-semibold text-[16px] ios-press"
            >
              Tirar outra
            </button>
            <button
              type="button"
              onClick={confirmPhoto}
              className="flex-1 h-[52px] rounded-[16px] bg-emerald-500 text-white font-semibold text-[16px] ios-press"
            >
              Confirmar
            </button>
          </div>
        )}

        {/* Error actions */}
        {status === 'error' && (
          <div className="flex gap-3 animate-ios-fade-up">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-[52px] rounded-[16px] bg-white/10 text-white font-semibold text-[16px] ios-press"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() => { setStatus('idle'); setErrorMessage(''); startCamera() }}
              className="flex-1 h-[52px] rounded-[16px] bg-blue-500 text-white font-semibold text-[16px] ios-press"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-2">
          <svg className="w-3.5 h-3.5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <p className="text-[12px] text-white/30">Dados protegidos com criptografia end-to-end</p>
        </div>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
