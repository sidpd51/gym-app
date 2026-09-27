export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(timestamp: string): string {
  const [datePart, timePart] = timestamp.split('T')
  const date = formatDate(datePart)
  if (!timePart) return date
  const [h, min] = timePart.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${date}, ${hour12}:${String(min).padStart(2, '0')} ${period}`
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}
