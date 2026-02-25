'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const iosButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.4px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
  {
    variants: {
      variant: {
        // Primary - iOS Blue
        primary: 'bg-[#007AFF] text-white shadow-[0_2px_12px_rgba(0,122,255,0.25)]',
        
        // Success - iOS Green
        success: 'bg-[#34C759] text-white shadow-[0_2px_12px_rgba(52,199,89,0.25)]',
        
        // Destructive - iOS Red
        destructive: 'bg-[#FF3B30] text-white shadow-[0_2px_12px_rgba(255,59,48,0.25)]',
        
        // Warning - iOS Orange
        warning: 'bg-[#FF9500] text-white shadow-[0_2px_12px_rgba(255,149,0,0.25)]',
        
        // Secondary - Gray filled
        secondary: 'bg-black/[0.05] dark:bg-white/[0.08] text-[#007AFF] dark:text-[#0A84FF]',
        
        // Outline - Border with blur
        outline: 'border-[0.5px] border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl text-[#007AFF] shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.04),0_2px_12px_rgba(0,0,0,0.3)]',
        
        // Ghost - No background
        ghost: 'text-[#007AFF] dark:text-[#0A84FF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
        
        // Link - Text only
        link: 'text-[#007AFF] dark:text-[#0A84FF] underline-offset-4 hover:underline active:opacity-70',
      },
      size: {
        xs: 'h-[36px] rounded-[10px] px-3 text-[14px]',
        sm: 'h-[44px] rounded-[12px] px-4 text-[15px]',
        default: 'h-[52px] rounded-[14px] px-6 text-[17px]',
        lg: 'h-[60px] rounded-[16px] px-8 text-[19px]',
        xl: 'h-[68px] rounded-[18px] px-10 text-[21px]',
        icon: 'h-[44px] w-[44px] rounded-[12px]',
        'icon-sm': 'h-[36px] w-[36px] rounded-[10px]',
        'icon-lg': 'h-[52px] w-[52px] rounded-[14px]',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
    },
  },
)

export interface IOSButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iosButtonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(iosButtonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="[&_svg]:w-5 [&_svg]:h-5">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="[&_svg]:w-5 [&_svg]:h-5">{rightIcon}</span>}
      </button>
    )
  },
)
IOSButton.displayName = 'IOSButton'

// Convenience components for common patterns
export const IOSButtonPrimary = React.forwardRef<HTMLButtonElement, Omit<IOSButtonProps, 'variant'>>(
  (props, ref) => <IOSButton ref={ref} variant="primary" {...props} />
)
IOSButtonPrimary.displayName = 'IOSButtonPrimary'

export const IOSButtonSuccess = React.forwardRef<HTMLButtonElement, Omit<IOSButtonProps, 'variant'>>(
  (props, ref) => <IOSButton ref={ref} variant="success" {...props} />
)
IOSButtonSuccess.displayName = 'IOSButtonSuccess'

export const IOSButtonDestructive = React.forwardRef<HTMLButtonElement, Omit<IOSButtonProps, 'variant'>>(
  (props, ref) => <IOSButton ref={ref} variant="destructive" {...props} />
)
IOSButtonDestructive.displayName = 'IOSButtonDestructive'

export const IOSButtonOutline = React.forwardRef<HTMLButtonElement, Omit<IOSButtonProps, 'variant'>>(
  (props, ref) => <IOSButton ref={ref} variant="outline" {...props} />
)
IOSButtonOutline.displayName = 'IOSButtonOutline'

export { IOSButton, iosButtonVariants }
