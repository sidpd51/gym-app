import { z } from 'zod';
import { dateString } from '../../common/validate.js';

export const createMembershipSchema = z.object({
  memberId: z.uuid(),
  planId: z.uuid(),
  startDate: dateString,
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
