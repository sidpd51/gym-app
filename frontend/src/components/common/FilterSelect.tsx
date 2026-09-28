import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export function FilterSelect({ className, children, ...props }: FilterSelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          'appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
        aria-hidden="true"
      />
    </div>
  )
}
