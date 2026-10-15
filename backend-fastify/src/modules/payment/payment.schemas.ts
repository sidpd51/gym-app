import { z } from 'zod';
import { dateString } from '../../common/validate.js';
import { decimalInput } from '../plan/plan.schemas.js';

export const createPaymentSchema = z.object({
  memberId: z.uuid(),
  membershipId: z.uuid().nullish(),
  amount: decimalInput,
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']),
  paymentDate: dateString,
  status: z.enum(['COMPLETED', 'PENDING', 'REFUNDED']).nullish(),
  reference: z.string().max(100).nullish(),
  notes: z.string().nullish(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
