import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/common/DatePicker'
import { DATE_PRESETS, DATE_PRESET_LABELS } from '../types/reports.types'
import type { DatePreset, DateRange } from '../types/reports.types'
import { getDateRange, formatDisplayRange } from '../utils/report-filters'

interface ReportDateFilterProps {
  onRangeChange: (range: DateRange) => void
}

export function ReportDateFilter({ onRangeChange }: ReportDateFilterProps) {
  const [preset, setPreset] = useState<DatePreset>('THIS_MONTH')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    if (preset !== 'CUSTOM') {
      onRangeChange(getDateRange(preset))
      return
    }
    if (customStart && customEnd && customStart <= customEnd) {
      onRangeChange({ start: customStart, end: customEnd })
    }
  }, [preset, customStart, customEnd, onRangeChange])

  const displayRange =
    preset === 'CUSTOM' && customStart && customEnd && customStart <= customEnd
      ? formatDisplayRange({ start: customStart, end: customEnd })
      : preset !== 'CUSTOM'
        ? formatDisplayRange(getDateRange(preset))
        : null

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        {DATE_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              preset === p
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50'
            )}
          >
            {DATE_PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {preset === 'CUSTOM' && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">From</label>
            <DatePicker
              value={customStart}
              onChange={setCustomStart}
              disabled={customEnd ? { after: new Date(customEnd + 'T00:00:00') } : undefined}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">To</label>
            <DatePicker
              value={customEnd}
              onChange={setCustomEnd}
              disabled={customStart ? { before: new Date(customStart + 'T00:00:00') } : undefined}
              className="w-auto"
            />
          </div>
        </div>
      )}

      {displayRange && (
        <p className="mt-2 text-xs text-zinc-500">
          Showing data for <span className="font-medium text-zinc-700">{displayRange}</span>
        </p>
      )}
    </div>
  )
}
