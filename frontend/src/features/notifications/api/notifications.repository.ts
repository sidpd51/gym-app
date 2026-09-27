import type { NotificationRecord } from '../types/notification.types'
import { notificationsMockData } from '../data/notifications.mock'

export interface NotificationRepository {
  list(): NotificationRecord[]
  listByMemberId(memberId: string): NotificationRecord[]
}

export const mockNotificationRepository: NotificationRepository = {
  list: () => notificationsMockData,
  listByMemberId: (memberId) =>
    notificationsMockData.filter((item) => item.memberId === memberId),
}

export const notificationRepository: NotificationRepository = mockNotificationRepository
