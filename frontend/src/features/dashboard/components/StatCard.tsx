import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconContainerClassName?: string
  iconColorClassName?: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconContainerClassName = 'bg-zinc-100',
  iconColorClassName = 'text-zinc-600',
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
        </div>
        <div className={cn('shrink-0 rounded-lg p-2.5', iconContainerClassName)}>
          <Icon size={20} className={iconColorClassName} aria-hidden="true" />
        </div>
      </div>

      {(description ?? trend) && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend ? (
            <>
              {trend.direction === 'up' && (
                <TrendingUp size={13} className="text-green-600" aria-hidden="true" />
              )}
              {trend.direction === 'down' && (
                <TrendingDown size={13} className="text-red-500" aria-hidden="true" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.direction === 'up' && 'text-green-600',
                  trend.direction === 'down' && 'text-red-500',
                  trend.direction === 'neutral' && 'text-zinc-500'
                )}
              >
                {trend.value}
              </span>
            </>
          ) : (
            <span className="text-xs text-zinc-500">{description}</span>
          )}
        </div>
      )}
    </div>
  )
}
