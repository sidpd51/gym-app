export type NotificationType = 'EXPIRY_REMINDER' | 'EXPIRED_NOTICE' | 'CUSTOM'
export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'IN_APP'
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED'

export interface NotificationRecord {
  id: string
  memberId: string
  membershipId: string
  type: NotificationType
  channel: NotificationChannel
  status: NotificationStatus
  message: string
  createdAt: string
  sentAt?: string
}

export type NotificationTab = 'expiring' | 'expired' | 'history'

export const NOTIFICATION_TABS: { id: NotificationTab; label: string }[] = [
  { id: 'expiring', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'history', label: 'Reminder History' },
]

export const EXPIRY_WINDOW_OPTIONS = [
  { value: 7, label: 'Next 7 days' },
  { value: 14, label: 'Next 14 days' },
  { value: 30, label: 'Next 30 days' },
] as const

export type ExpiryWindow = 7 | 14 | 30
