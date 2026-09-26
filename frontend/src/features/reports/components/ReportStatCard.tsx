interface ReportStatCardProps {
  label: string
  value: string | number
  subtext?: string
  highlight?: 'positive' | 'negative' | 'neutral'
}

export function ReportStatCard({ label, value, subtext, highlight }: ReportStatCardProps) {
  const valueColor =
    highlight === 'positive'
      ? 'text-emerald-600'
      : highlight === 'negative'
        ? 'text-red-600'
        : 'text-zinc-900'

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {subtext && <p className="mt-0.5 text-xs text-zinc-500">{subtext}</p>}
    </div>
  )
}
