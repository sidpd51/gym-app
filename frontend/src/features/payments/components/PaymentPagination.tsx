import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentPaginationProps {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function PaymentPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: PaymentPaginationProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 sm:flex-row">
      <p className="text-xs text-zinc-500">
        Showing <span className="font-medium text-zinc-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-zinc-700">{totalCount}</span> payments
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-zinc-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'inline-flex h-7 min-w-7 items-center justify-center rounded border px-1.5 text-xs',
              p === page
                ? 'border-blue-600 bg-blue-600 font-medium text-white'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            )}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-zinc-50"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
