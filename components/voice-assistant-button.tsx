'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { useVoiceAssistant, type VoiceCommand } from '@/hooks/use-voice-assistant'
import { useHaptic } from '@/hooks/use-haptic'
import { iosToast } from '@/lib/utils/ios-toast'
import { useRouter } from 'next/navigation'

export function VoiceAssistantButton() {
  const [showTranscript, setShowTranscript] = useState(false)
  const router = useRouter()
  const haptic = useHaptic()

  const { isListening, isSupported, transcript, startListening, stopListening } = useVoiceAssistant({
    onCommand: handleVoiceCommand,
    onError: (error) => {
      iosToast.error(error)
      haptic.notification('error')
    },
    continuous: false,
    interimResults: true,
  })

  function handleVoiceCommand(command: VoiceCommand) {
    console.log('[v0] Processing voice command:', command)
    haptic.notification('success')

    if (command.type === 'ride_request' && command.destination) {
      // Store destination and navigate to route input
      sessionStorage.setItem('voiceDestination', command.destination)
      iosToast.success(`Solicitando corrida para ${command.destination}`, {
        action: {
          label: 'Ver',
          onClick: () => router.push('/uppi/ride/route-input')
        }
      })
      
      // Navigate after a short delay
      setTimeout(() => {
        router.push('/uppi/ride/route-input')
      }, 1500)
    } else if (command.type === 'navigate') {
      router.back()
    } else if (command.type === 'settings') {
      router.push('/uppi/settings')
    } else {
      iosToast.warning('Comando não reconhecido. Tente: "Ir para [destino]"')
    }
  }

  useEffect(() => {
    if (isListening) {
      setShowTranscript(true)
    } else {
      setTimeout(() => setShowTranscript(false), 2000)
    }
  }, [isListening])

  if (!isSupported) {
    return null // Hide button if not supported
  }

  const handleToggle = () => {
    if (isListening) {
      stopListening()
      haptic.impact('light')
    } else {
      startListening()
      haptic.impact('medium')
    }
  }

  return (
    <>
      {/* Voice button - iOS Siri style */}
      <button
        onClick={handleToggle}
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all ios-press shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_2px_16px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 ${
          isListening 
            ? 'bg-gradient-to-br from-[#FF3B30] to-[#FF453A] animate-pulse scale-105' 
            : 'bg-gradient-to-br from-[#007AFF] to-[#5856D6] hover:scale-105'
        }`}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 text-white" strokeWidth={2.5} />
        ) : (
          <Mic className="w-5 h-5 text-white" strokeWidth={2.5} />
        )}
      </button>

      {/* Transcript overlay - iOS style */}
      {showTranscript && (
        <div className="fixed inset-x-0 bottom-32 flex justify-center px-6 z-50 pointer-events-none animate-ios-fade-up">
          <div className="bg-white/90 dark:bg-black/85 ios-blur-heavy rounded-[20px] px-5 py-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1),0_4px_24px_rgba(0,0,0,0.6)] max-w-sm border border-black/[0.06] dark:border-white/[0.1]">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#FF3B30] animate-pulse shadow-[0_0_4px_rgba(255,59,48,0.6)]' : 'bg-[#8E8E93]'}`} />
              <span className="text-[13px] font-semibold text-[#8E8E93] tracking-[-0.2px]">
                {isListening ? 'Ouvindo...' : 'Processando...'}
              </span>
            </div>
            <p className="text-[17px] font-medium text-foreground tracking-[-0.4px]">
              {transcript || 'Diga seu destino...'}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
