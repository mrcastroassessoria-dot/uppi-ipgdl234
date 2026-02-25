'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface VoiceAssistantOptions {
  onResult?: (transcript: string) => void
  onCommand?: (command: VoiceCommand) => void
  onError?: (error: string) => void
  continuous?: boolean
  interimResults?: boolean
}

export interface VoiceCommand {
  type: 'ride_request' | 'navigate' | 'settings' | 'unknown'
  destination?: string
  origin?: string
  raw: string
}

export function useVoiceAssistant(options: VoiceAssistantOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (!SpeechRecognition) {
      options.onError?.('Speech Recognition não é suportado neste navegador')
      return
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = options.continuous ?? false
    recognition.interimResults = options.interimResults ?? true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[v0] Voice recognition started')
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const transcriptText = event.results[current][0].transcript
      
      console.log('[v0] Voice transcript:', transcriptText)
      setTranscript(transcriptText)
      options.onResult?.(transcriptText)

      // Parse command if final result
      if (event.results[current].isFinal) {
        const command = parseVoiceCommand(transcriptText)
        console.log('[v0] Parsed command:', command)
        options.onCommand?.(command)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[v0] Voice recognition error:', event.error)
      setIsListening(false)
      
      let errorMessage = 'Erro no reconhecimento de voz'
      if (event.error === 'no-speech') {
        errorMessage = 'Nenhuma fala detectada'
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microfone não encontrado'
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Permissão de microfone negada'
      }
      
      options.onError?.(errorMessage)
    }

    recognition.onend = () => {
      console.log('[v0] Voice recognition ended')
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      options.onError?.('Speech Recognition não disponível')
      return
    }

    try {
      setTranscript('')
      recognitionRef.current.start()
    } catch (error) {
      console.error('[v0] Error starting recognition:', error)
      options.onError?.('Erro ao iniciar reconhecimento de voz')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
  }
}

// Parse voice commands
function parseVoiceCommand(text: string): VoiceCommand {
  const lowerText = text.toLowerCase().trim()

  // Ride request patterns
  const ridePatterns = [
    /(?:ir|vou|quero ir|me leva|leva|chamar corrida|pedir corrida|solicitar corrida|corrida).*(?:para|pro|pra|até|em)\s+(.+)/i,
    /corrida.*(?:para|pro|pra|até|em)\s+(.+)/i,
    /(?:para|pro|pra)\s+(.+)/i,
  ]

  for (const pattern of ridePatterns) {
    const match = text.match(pattern)
    if (match) {
      return {
        type: 'ride_request',
        destination: match[1]?.trim(),
        raw: text,
      }
    }
  }

  // Navigation patterns
  if (lowerText.includes('voltar') || lowerText.includes('retornar')) {
    return { type: 'navigate', raw: text }
  }

  // Settings patterns
  if (lowerText.includes('configurações') || lowerText.includes('configuracao') || lowerText.includes('ajustes')) {
    return { type: 'settings', raw: text }
  }

  return { type: 'unknown', raw: text }
}
