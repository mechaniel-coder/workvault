import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'light' | 'dark'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = 'light', className = '', id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${variant === 'dark' ? 'text-white/70' : 'text-surface-700'}`}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
          variant === 'dark'
            ? 'border-white/20 bg-white/10 text-white placeholder:text-white/30 focus:border-brand-400 focus:ring-brand-500/20'
            : 'border-surface-200 bg-white text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:ring-brand-500/20'
        } ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'
