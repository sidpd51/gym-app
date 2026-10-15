import { z } from 'zod';
import { dateString } from '../../common/validate.js';

const optStr = (max: number) => z.string().max(max).nullish();
const email = z.union([z.literal(''), z.email().max(255)]).nullish();

export const createMemberSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().regex(/^\d{10}$/),
  email,
  joiningDate: dateString,
  dateOfBirth: dateString.nullish(),
  gender: optStr(10),
  address: z.string().nullish(),
  emergencyContactName: optStr(100),
  emergencyContactPhone: optStr(20),
  emergencyContactRelationship: optStr(50),
});

export const updateMemberSchema = z.object({
  firstName: z.string().min(1).max(50).nullish(),
  lastName: z.string().min(1).max(50).nullish(),
  email,
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']).nullish(),
  dateOfBirth: dateString.nullish(),
  gender: optStr(10),
  address: z.string().nullish(),
  emergencyContactName: optStr(100),
  emergencyContactPhone: optStr(20),
  emergencyContactRelationship: optStr(50),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
