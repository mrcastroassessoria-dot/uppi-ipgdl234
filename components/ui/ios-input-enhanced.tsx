'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState, forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { triggerHaptic } from '@/lib/utils/ios-haptics'

interface IOSInputEnhancedProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  isLoading?: boolean
  showValidation?: boolean
  onClear?: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'underline'
}

export const IOSInputEnhanced = forwardRef<HTMLInputElement, IOSInputEnhancedProps>(
  (
    {
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      isLoading,
      showValidation = true,
      onClear,
      size = 'md',
      variant = 'default',
      className,
      type,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const hasValue = value !== undefined && value !== ''
    const hasError = !!error
    const hasSuccess = !!success && !hasError

    const sizeStyles = {
      sm: 'h-9 text-sm px-3',
      md: 'h-11 text-base px-4',
      lg: 'h-14 text-lg px-5'
    }

    const variantStyles = {
      default: cn(
        'bg-card border rounded-xl',
        hasError && 'border-red-500 focus-within:border-red-500',
        hasSuccess && 'border-emerald-500 focus-within:border-emerald-500',
        !hasError && !hasSuccess && 'border-border focus-within:border-primary'
      ),
      filled: cn(
        'bg-muted/50 border border-transparent rounded-xl',
        hasError && 'bg-red-500/10 border-red-500/20',
        hasSuccess && 'bg-emerald-500/10 border-emerald-500/20',
        'focus-within:bg-card focus-within:border-border'
      ),
      underline: cn(
        'bg-transparent border-b border-t-0 border-x-0 rounded-none px-0',
        hasError && 'border-red-500',
        hasSuccess && 'border-emerald-500',
        !hasError && !hasSuccess && 'border-border focus-within:border-primary'
      )
    }

    const handleClear = () => {
      triggerHaptic('selection')
      onClear?.()
    }

    const togglePasswordVisibility = () => {
      triggerHaptic('selection')
      setShowPassword(!showPassword)
    }

    return (
      <div className={cn('w-full space-y-1.5', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-foreground px-1">
            {label}
          </label>
        )}

        {/* Input Container */}
        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30
          }}
          className={cn(
            'relative flex items-center gap-2 transition-all duration-200',
            sizeStyles[size],
            variantStyles[variant],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div className="flex-shrink-0 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            value={value}
            disabled={disabled}
            onFocus={() => {
              setIsFocused(true)
              triggerHaptic('selection')
            }}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'flex-1 bg-transparent text-foreground placeholder:text-muted-foreground',
              'focus:outline-none',
              'disabled:cursor-not-allowed'
            )}
            {...props}
          />

          {/* Right Icons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Loading */}
            {isLoading && (
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            )}

            {/* Validation Icon */}
            {showValidation && !isLoading && (
              <AnimatePresence mode="wait">
                {hasError && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </motion.div>
                )}
                {hasSuccess && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check className="w-4 h-4 text-emerald-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Clear Button */}
            {hasValue && onClear && !isLoading && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleClear}
                type="button"
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center',
                  'bg-muted-foreground/20 text-muted-foreground',
                  'hover:bg-muted-foreground/30 active:scale-90',
                  'transition-all duration-150'
                )}
              >
                <X className="w-3 h-3" />
              </motion.button>
            )}

            {/* Password Toggle */}
            {isPassword && !isLoading && (
              <button
                onClick={togglePasswordVisibility}
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Custom Right Icon */}
            {rightIcon && !isLoading && (
              <div className="text-muted-foreground">
                {rightIcon}
              </div>
            )}
          </div>
        </motion.div>

        {/* Helper Text */}
        <AnimatePresence mode="wait">
          {(error || success || hint) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'text-xs px-1',
                hasError && 'text-red-500',
                hasSuccess && 'text-emerald-500',
                !hasError && !hasSuccess && 'text-muted-foreground'
              )}
            >
              {error || success || hint}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

IOSInputEnhanced.displayName = 'IOSInputEnhanced'

// Textarea variant
interface IOSTextareaEnhancedProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  maxLength?: number
  showCounter?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled'
}

export const IOSTextareaEnhanced = forwardRef<HTMLTextAreaElement, IOSTextareaEnhancedProps>(
  (
    {
      label,
      error,
      hint,
      maxLength,
      showCounter = true,
      size = 'md',
      variant = 'default',
      className,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const hasError = !!error
    const currentLength = String(value || '').length

    const sizeStyles = {
      sm: 'min-h-[80px] text-sm p-3',
      md: 'min-h-[100px] text-base p-4',
      lg: 'min-h-[120px] text-lg p-5'
    }

    const variantStyles = {
      default: cn(
        'bg-card border rounded-xl',
        hasError && 'border-red-500 focus-within:border-red-500',
        !hasError && 'border-border focus-within:border-primary'
      ),
      filled: cn(
        'bg-muted/50 border border-transparent rounded-xl',
        hasError && 'bg-red-500/10 border-red-500/20',
        'focus-within:bg-card focus-within:border-border'
      )
    }

    return (
      <div className={cn('w-full space-y-1.5', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-foreground px-1">
            {label}
          </label>
        )}

        {/* Textarea Container */}
        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30
          }}
          className={cn(
            'relative transition-all duration-200',
            sizeStyles[size],
            variantStyles[variant],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <textarea
            ref={ref}
            value={value}
            disabled={disabled}
            maxLength={maxLength}
            onFocus={() => {
              setIsFocused(true)
              triggerHaptic('selection')
            }}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full bg-transparent text-foreground placeholder:text-muted-foreground',
              'focus:outline-none resize-none',
              'disabled:cursor-not-allowed'
            )}
            {...props}
          />
        </motion.div>

        {/* Footer */}
        <div className="flex items-center justify-between px-1">
          {/* Helper Text */}
          <AnimatePresence mode="wait">
            {(error || hint) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'text-xs',
                  hasError && 'text-red-500',
                  !hasError && 'text-muted-foreground'
                )}
              >
                {error || hint}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Character Counter */}
          {showCounter && maxLength && (
            <div
              className={cn(
                'text-xs',
                currentLength > maxLength * 0.9 ? 'text-orange-500' : 'text-muted-foreground'
              )}
            >
              {currentLength}/{maxLength}
            </div>
          )}
        </div>
      </div>
    )
  }
)

IOSTextareaEnhanced.displayName = 'IOSTextareaEnhanced'
