import { useState } from 'react'
import type { Matcher } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
  disabled?: Matcher | Matcher[]
  className?: string
}

export function DatePicker({ value, onChange, error, disabled, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  function handleSelect(day: Date | undefined) {
    if (day) {
      const yyyy = day.getFullYear()
      const mm = String(day.getMonth() + 1).padStart(2, '0')
      const dd = String(day.getDate()).padStart(2, '0')
      onChange(`${yyyy}-${mm}-${dd}`)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2',
            error
              ? 'border-red-300 bg-red-50 text-zinc-900 focus:ring-red-400'
              : 'border-zinc-200 bg-white text-zinc-700 focus:ring-blue-500',
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
          <span className={selected ? 'text-zinc-900' : 'text-zinc-400'}>
            {selected ? format(selected, 'dd MMM yyyy') : 'Select date'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
