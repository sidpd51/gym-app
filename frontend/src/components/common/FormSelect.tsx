import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  children: React.ReactNode
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, error, disabled, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full appearance-none rounded-lg border py-2 pl-3 pr-8 text-sm text-zinc-900 focus:outline-none focus:ring-2',
            error
              ? 'border-red-300 bg-red-50 focus:ring-red-400'
              : 'border-zinc-200 bg-white focus:ring-blue-500',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2',
            disabled ? 'text-zinc-300' : 'text-zinc-400'
          )}
          aria-hidden="true"
        />
      </div>
    )
  }
)
FormSelect.displayName = 'FormSelect'
