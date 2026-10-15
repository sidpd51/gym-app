import { z } from 'zod';
import { dateString } from '../../common/validate.js';

const status = z.enum(['ACTIVE', 'INACTIVE']);
const int = z.number().int();

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
export const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.uuid(),
  unit: z.string().min(1).max(20),
  currentStock: int.min(0).nullish().transform((v) => v ?? 0),
  minimumStock: int.min(0).nullish().transform((v) => v ?? 0),
  description: z.string().nullish(),
});
export const updateItemSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  unit: z.string().max(20).nullish(),
  minimumStock: int.min(0).nullish(),
  description: z.string().nullish(),
});
export const transactionSchema = z.object({
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
  quantity: int.gt(0),
  transactionDate: dateString,
  reference: z.string().max(100).nullish(),
  notes: z.string().nullish(),
});

export type CategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ItemInput = z.infer<typeof createItemSchema>;
export type ItemUpdateInput = z.infer<typeof updateItemSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
