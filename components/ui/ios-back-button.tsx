'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IOSBackButtonProps {
  onClick?: () => void
  className?: string
  label?: string
}

export function IOSBackButton({ onClick, className, label }: IOSBackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-1 rounded-full h-9 transition-all duration-200',
        'text-[#007AFF] font-normal text-[17px]',
        'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
        'active:scale-95 active:bg-black/[0.06] dark:active:bg-white/[0.08]',
        label ? 'px-3 -ml-3' : 'w-9 justify-center',
        className
      )}
      aria-label="Voltar"
    >
      <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
      {label && <span>{label}</span>}
    </button>
  )
}
