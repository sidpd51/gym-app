import { z } from 'zod';

const role = z.enum(['OWNER', 'ADMIN', 'RECEPTIONIST', 'TRAINER']);

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.email().max(255),
  phone: z.string().max(20).nullish().transform((v) => v ?? undefined),
  role,
  password: z.string().min(8).max(72),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).nullish(),
  lastName: z.string().min(1).max(50).nullish(),
  phone: z.string().max(20).nullish(),
  role: role.nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(50).nullish(),
    lastName: z.string().min(1).max(50).nullish(),
    phone: z.string().max(20).nullish(),
    currentPassword: z.string().min(1).nullish(),
    newPassword: z.string().min(8).max(72).nullish(),
  })
  .refine((v) => !v.newPassword || !!v.currentPassword, {
    path: ['newPassword'],
    message: 'currentPassword is required with newPassword',
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
