import { z } from 'zod';

/** Accepts a JSON number or numeric string (shopspring/decimal decodes both); normalised to a string. */
export const decimalInput = z
  .union([z.number().finite(), z.string().regex(/^-?\d+(\.\d+)?$/, 'must be a decimal number')])
  .transform((v) => String(v));

const status = z.enum(['ACTIVE', 'INACTIVE']);

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  durationInDays: z.number().int().gte(1),
  price: decimalInput,
  status: status.nullish(),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  description: z.string().nullish(),
  durationInDays: z.number().int().gte(1).nullish(),
  price: decimalInput.nullish(),
  status: status.nullish(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
