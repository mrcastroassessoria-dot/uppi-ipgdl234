'use client'

import { useState, useEffect } from 'react'
import { MapPin, Clock } from 'lucide-react'

interface LocationTagProps {
  className?: string
}

const cities = [
  'São Paulo',
  'Rio de Janeiro', 
  'Belo Horizonte',
  'Brasília',
  'Salvador',
  'Fortaleza',
  'Curitiba',
  'Porto Alegre'
]

export function LocationTag({ className }: LocationTagProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState('')
  const [showCity, setShowCity] = useState(true)

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }
    
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    
    return () => clearInterval(timeInterval)
  }, [])

  // Rotate cities and toggle between city/time every 5 seconds
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setShowCity((prev) => {
        if (!prev) {
          // If we're currently showing time, switch to next city
          setCurrentIndex((prevIndex) => (prevIndex + 1) % cities.length)
        }
        return !prev
      })
    }, 5000)

    return () => clearInterval(rotationInterval)
  }, [])

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-black/60 ios-blur px-2.5 py-1.5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.08),0_1px_3px_rgba(0,0,0,0.4)] border border-black/[0.04] dark:border-white/[0.06] ${className ?? ''}`}
    >
      <span className="relative flex h-[5px] w-[5px]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34C759] opacity-75" />
        <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-[#34C759] shadow-[0_0_3px_rgba(52,199,89,0.6)]" />
      </span>
      {showCity ? (
        <>
          <MapPin className="w-3 h-3 text-[#007AFF]" strokeWidth={2.5} />
          <span className="text-[11px] font-semibold text-foreground leading-none tracking-[-0.1px]">
            {cities[currentIndex]}
          </span>
        </>
      ) : (
        <>
          <Clock className="w-3 h-3 text-[#007AFF]" strokeWidth={2.5} />
          <span className="text-[11px] font-semibold text-foreground leading-none tabular-nums tracking-[-0.1px]">
            {currentTime}
          </span>
        </>
      )}
    </div>
  )
}
