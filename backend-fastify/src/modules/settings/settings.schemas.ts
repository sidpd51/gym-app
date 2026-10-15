import { z } from 'zod';

export const settingsSchema = z.object({
  gymName: z.string().max(100).nullish(),
  phone: z.string().max(20).nullish(),
  email: z.email().max(255).nullish(),
  address: z.string().nullish(),
  currency: z.string().length(3).nullish(),
  timezone: z.string().max(50).nullish(),
  dateFormat: z.string().max(20).nullish(),
  membershipGracePeriodDays: z.number().int().min(0).max(2147483647).nullish(),
  attendanceStartTime: z.string().length(5).nullish(),
  attendanceEndTime: z.string().length(5).nullish(),
  allowAttendanceForExpiredMembership: z.boolean().nullish(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
