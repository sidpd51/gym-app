import { notificationRepository } from '../api/notifications.repository'
import type { NotificationRecord } from '../types/notification.types'

export function useNotifications(): { notifications: NotificationRecord[] } {
  return { notifications: notificationRepository.list() }
}

export function useMemberNotifications(memberId: string | undefined): {
  notifications: NotificationRecord[]
} {
  return {
    notifications: memberId ? notificationRepository.listByMemberId(memberId) : [],
  }
}
