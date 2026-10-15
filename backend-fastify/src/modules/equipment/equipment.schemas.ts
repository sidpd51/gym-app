import { z } from 'zod';
import { dateString } from '../../common/validate.js';

/** Go decimal accepts a JSON number or numeric string; normalised to a string for the DB driver. */
const decimalInput = z
  .union([z.number().finite(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .transform((v) => String(v));

const equipmentStatus = z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED']);
const optStr = (max: number) => z.string().max(max).nullish();

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

// Go does not validate category updates (empty name = keep existing); only the enum is checked here.
export const categoryUpdateSchema = z.object({
  name: z.string().max(100).nullish(),
  description: z.string().nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

export const equipmentSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.uuid(),
  brand: optStr(100),
  model: optStr(100),
  serialNumber: optStr(100),
  purchaseDate: dateString.nullish(),
  purchaseCost: decimalInput.nullish(),
  location: optStr(100),
  status: equipmentStatus.nullish(),
  notes: z.string().nullish(),
});

export const equipmentUpdateSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  brand: optStr(100),
  model: optStr(100),
  serialNumber: optStr(100),
  location: optStr(100),
  status: equipmentStatus.nullish(),
  notes: z.string().nullish(),
});

export const maintenanceSchema = z.object({
  maintenanceDate: dateString,
  maintenanceType: z.enum(['ROUTINE', 'REPAIR', 'INSPECTION', 'REPLACEMENT']),
  description: z.string().min(1),
  cost: decimalInput.nullish(),
  performedBy: optStr(100),
  nextMaintenanceDate: dateString.nullish(),
  notes: z.string().nullish(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
