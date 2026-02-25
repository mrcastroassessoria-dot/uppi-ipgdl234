export function UppiLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Gradient circle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-[20px] shadow-[0_4px_16px_rgba(0,122,255,0.3)]" />
      
      {/* Logo content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 48 48" fill="none" className="w-[65%] h-[65%]">
          {/* Stylized "U" for Uppi */}
          <path
            d="M14 12 L14 22 C14 28 18 32 24 32 C30 32 34 28 34 22 L34 12"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Accent dot */}
          <circle cx="24" cy="36" r="2.5" fill="white" />
        </svg>
      </div>
    </div>
  )
}

export function UppiWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <UppiLogo size={44} />
      <span className="text-[32px] font-bold tracking-[-0.8px] bg-gradient-to-br from-[#007AFF] to-[#5856D6] bg-clip-text text-transparent">
        Uppi
      </span>
    </div>
  )
}
