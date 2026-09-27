import type { NotificationChannel, NotificationStatus } from '../types/notification.types'

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  IN_APP: 'In-App',
}

export const STATUS_LABELS: Record<NotificationStatus, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  FAILED: 'Failed',
}

export function formatNotificationDate(dateStr: string): string {
  const [datePart] = dateStr.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
