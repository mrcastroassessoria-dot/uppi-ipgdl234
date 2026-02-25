'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Shield, AlertTriangle } from 'lucide-react'
import { useHaptic } from '@/hooks/use-haptic'
import { iosToast } from '@/lib/utils/ios-toast'

interface RideAudioRecorderProps {
  rideId: string
  enabled: boolean
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void
}

export function RideAudioRecorder({ rideId, enabled, onRecordingComplete }: RideAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const haptic = useHaptic()

  // Request microphone permission on mount if enabled
  useEffect(() => {
    if (!enabled) return

    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setHasPermission(true)
        stream.getTracks().forEach(track => track.stop()) // Stop the test stream
      } catch (error) {
        console.error('[v0] Microphone permission denied:', error)
        setHasPermission(false)
        iosToast.error('Permissão de microfone negada', 'Ative nas configurações do navegador')
      }
    }

    requestPermission()
  }, [enabled])

  // Start recording when ride starts (if enabled and has permission)
  useEffect(() => {
    if (!enabled || !hasPermission || isRecording) return

    startRecording()

    return () => {
      stopRecording()
    }
  }, [enabled, hasPermission])

  const startRecording = async () => {
    if (!hasPermission) {
      iosToast.error('Sem permissão', 'Permita acesso ao microfone')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        
        // Upload to server
        await uploadRecording(audioBlob, duration)
        
        onRecordingComplete?.(audioBlob, duration)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000) // Record in 1 second chunks
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      haptic('light')

      // Start duration counter
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

      console.log('[v0] Audio recording started for ride:', rideId)
    } catch (error) {
      console.error('[v0] Failed to start recording:', error)
      iosToast.error('Erro ao gravar', 'Não foi possível iniciar a gravação')
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return

    mediaRecorderRef.current.stop()
    setIsRecording(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    haptic('medium')
    console.log('[v0] Audio recording stopped. Duration:', duration, 'seconds')
  }

  const uploadRecording = async (audioBlob: Blob, durationSeconds: number) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `ride-${rideId}-${Date.now()}.webm`)
      formData.append('ride_id', rideId)
      formData.append('duration', durationSeconds.toString())

      const response = await fetch('/api/v1/recordings/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      console.log('[v0] Recording uploaded successfully:', data.id)
      iosToast.success('Gravação salva', 'Áudio criptografado armazenado com segurança')
    } catch (error) {
      console.error('[v0] Failed to upload recording:', error)
      iosToast.error('Erro ao salvar', 'Não foi possível enviar a gravação')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!enabled) return null
  if (hasPermission === false) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
        <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
          Gravação desabilitada: sem permissão de microfone
        </span>
      </div>
    )
  }

  if (hasPermission === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-xl">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground font-medium">
          Solicitando permissão de microfone...
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card/95 ios-blur rounded-2xl border border-border/50 shadow-sm">
      {/* Recording indicator */}
      <div className="relative">
        {isRecording ? (
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
            <Mic className="relative w-5 h-5 text-red-500" strokeWidth={2.5} />
          </div>
        ) : (
          <MicOff className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
          <span className="text-xs font-bold text-foreground">
            {isRecording ? 'Gravando' : 'Pronto para gravar'}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Áudio criptografado • Apagado em 7 dias
        </p>
      </div>

      {/* Duration */}
      {isRecording && (
        <div className="px-3 py-1.5 bg-red-500/10 rounded-lg">
          <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
            {formatDuration(duration)}
          </span>
        </div>
      )}
    </div>
  )
}
