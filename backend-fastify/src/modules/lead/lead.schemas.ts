import { z } from 'zod';
import { dateString } from '../../common/validate.js';

const email = z.union([z.literal(''), z.email().max(255)]).nullish();
const source = z.enum(['WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER']).nullish();

export const createLeadSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email,
  source,
  interestedPlanId: z.uuid().nullish(),
  notes: z.string().nullish(),
  nextFollowUpDate: dateString.nullish(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  phone: z.string().max(20).nullish(),
  email,
  source,
  interestedPlanId: z.uuid().nullish(),
  status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST']).nullish(),
  notes: z.string().nullish(),
  lastFollowUpDate: dateString.nullish(),
  nextFollowUpDate: dateString.nullish(),
});

export const convertLeadSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  joiningDate: dateString,
  phone: z.string().regex(/^\d{10}$/),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
