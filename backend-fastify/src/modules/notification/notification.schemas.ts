import { z } from 'zod';

export const createNotificationSchema = z.object({
  memberId: z.uuid(),
  membershipId: z.uuid(),
  type: z.enum(['EXPIRY_REMINDER', 'EXPIRED_NOTICE', 'CUSTOM']),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP']),
  message: z.string().min(1),
});

export const listQuerySchema = z.object({
  status: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['PENDING', 'SENT', 'FAILED']).optional()),
});

export type NotificationInput = z.infer<typeof createNotificationSchema>;
