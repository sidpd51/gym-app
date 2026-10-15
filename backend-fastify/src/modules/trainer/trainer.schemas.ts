import { z } from 'zod';
import { dateString } from '../../common/validate.js';

const email = z.union([z.literal(''), z.email().max(255)]).nullish();

export const createTrainerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(1).max(20),
  email,
  specialization: z.string().max(100).nullish(),
  joiningDate: dateString,
});

export const updateTrainerSchema = z.object({
  firstName: z.string().min(1).max(50).nullish(),
  lastName: z.string().min(1).max(50).nullish(),
  phone: z.string().max(20).nullish(),
  email,
  specialization: z.string().max(100).nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

export const assignTrainerSchema = z.object({ trainerId: z.uuid() });

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerInput = z.infer<typeof updateTrainerSchema>;
