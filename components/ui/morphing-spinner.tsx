"use client"

import { cn } from "@/lib/utils"

interface MorphingSpinnerProps {
  size?: "sm" | "md" | "lg" | number
  className?: string
}

export function MorphingSpinner({ size = "md", className }: MorphingSpinnerProps) {
  const sizeClasses = typeof size === 'number' 
    ? { width: size, height: size }
    : {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
      }[size]

  return (
    <div 
      className={cn("relative animate-spin", typeof size === 'string' ? sizeClasses : '', className)}
      style={typeof size === 'number' ? { width: size, height: size } : undefined}
    >
      <div className="absolute inset-0 rounded-full border-4 border-[#007AFF]/20" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#007AFF]" />
    </div>
  )
}
