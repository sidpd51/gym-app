import { z } from 'zod';
import { dateString } from '../../common/validate.js';

const status = z.enum(['ACTIVE', 'INACTIVE']);
const method = z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']);
/** Go's decimal.Decimal accepts JSON numbers or numeric strings. */
const amount = z
  .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .transform((v) => String(v));

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  status: status.nullish(),
});
// Go does no validation on category update; empty name simply means "unchanged".
export const updateCategorySchema = z.object({
  name: z.string().nullish(),
  description: z.string().nullish(),
  status: status.nullish(),
});
export const createExpenseSchema = z.object({
  categoryId: z.uuid(),
  description: z.string().min(1),
  amount,
  expenseDate: dateString,
  paymentMethod: method,
  vendor: z.string().max(100).nullish(),
  notes: z.string().nullish(),
});
export const updateExpenseSchema = z.object({
  categoryId: z.uuid().nullish(),
  description: z.string().nullish(),
  amount: amount.nullish(),
  expenseDate: dateString.nullish(),
  paymentMethod: method.nullish(),
  vendor: z.string().nullish(),
  notes: z.string().nullish(),
});

export type CategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ExpenseInput = z.infer<typeof createExpenseSchema>;
export type ExpenseUpdateInput = z.infer<typeof updateExpenseSchema>;
