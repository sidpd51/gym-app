import type { NotificationRecord } from '../types/notification.types'

export const notificationsMockData: NotificationRecord[] = [
  {
    id: 'notif001',
    memberId: 'm006',
    membershipId: 'ms011',
    type: 'EXPIRY_REMINDER',
    channel: 'SMS',
    status: 'SENT',
    message:
      'Hi Vikram, your Quarterly membership expired on 01 Jul 2026. Please renew to continue accessing the gym.',
    createdAt: '2026-07-01T09:00:00',
    sentAt: '2026-07-01T09:01:23',
  },
  {
    id: 'notif002',
    memberId: 'm007',
    membershipId: 'ms012',
    type: 'EXPIRY_REMINDER',
    channel: 'WHATSAPP',
    status: 'SENT',
    message:
      'Hi Neha, your Monthly Basic membership is expiring on 31 Aug 2026. Please renew soon to avoid a break in access.',
    createdAt: '2026-08-28T10:30:00',
    sentAt: '2026-08-28T10:30:47',
  },
  {
    id: 'notif003',
    memberId: 'm008',
    membershipId: 'ms013',
    type: 'EXPIRED_NOTICE',
    channel: 'EMAIL',
    status: 'SENT',
    message:
      'Dear Deepak, your Annual membership has expired. Please visit the gym to renew your membership.',
    createdAt: '2026-01-01T08:00:00',
    sentAt: '2026-01-01T08:00:52',
  },
  {
    id: 'notif004',
    memberId: 'm009',
    membershipId: 'ms014',
    type: 'EXPIRED_NOTICE',
    channel: 'IN_APP',
    status: 'SENT',
    message:
      'Kavita, your Half-Yearly membership expired on 01 Jul 2026. Renew now to regain access.',
    createdAt: '2026-07-02T11:00:00',
    sentAt: '2026-07-02T11:00:05',
  },
  {
    id: 'notif005',
    memberId: 'm010',
    membershipId: 'ms015',
    type: 'EXPIRY_REMINDER',
    channel: 'SMS',
    status: 'SENT',
    message:
      'Hi Suresh, your Quarterly membership expired on 01 Aug 2026. Please renew your membership.',
    createdAt: '2026-08-01T09:15:00',
    sentAt: '2026-08-01T09:15:33',
  },
  {
    id: 'notif006',
    memberId: 'm001',
    membershipId: 'ms001',
    type: 'EXPIRY_REMINDER',
    channel: 'WHATSAPP',
    status: 'PENDING',
    message:
      'Hi Rahul, your Monthly Basic membership is expiring on 01 Oct 2026 (in 4 days). Please renew soon.',
    createdAt: '2026-09-27T10:00:00',
  },
  {
    id: 'notif007',
    memberId: 'm014',
    membershipId: 'ms016',
    type: 'EXPIRED_NOTICE',
    channel: 'SMS',
    status: 'PENDING',
    message:
      'Hi Ajay, your Monthly Basic membership has expired. Please renew to continue your fitness journey.',
    createdAt: '2026-09-27T10:05:00',
  },
  {
    id: 'notif008',
    memberId: 'm016',
    membershipId: 'ms017',
    type: 'EXPIRED_NOTICE',
    channel: 'EMAIL',
    status: 'FAILED',
    message: 'Dear Sanjay, your Student Monthly membership expired on 14 Aug 2026. Please renew.',
    createdAt: '2026-08-14T08:00:00',
  },
]
