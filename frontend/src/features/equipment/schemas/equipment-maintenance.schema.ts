import { z } from 'zod'

export const equipmentMaintenanceSchema = z
  .object({
    maintenanceDate: z.string().min(1, 'Maintenance date is required'),

    maintenanceType: z.string().min(1, 'Please select a maintenance type'),

    description: z
      .string()
      .min(3, 'Description must be at least 3 characters')
      .max(500, 'Description must be at most 500 characters'),

    cost: z
      .string()
      .refine(
        (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0),
        'Enter a valid amount (0 or more)',
      )
      .optional(),

    performedBy: z.string().optional(),

    nextMaintenanceDate: z.string().optional(),

    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.nextMaintenanceDate &&
      data.maintenanceDate &&
      data.nextMaintenanceDate < data.maintenanceDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nextMaintenanceDate'],
        message: 'Next maintenance date cannot be before the maintenance date',
      })
    }
  })

export type EquipmentMaintenanceFormValues = z.infer<typeof equipmentMaintenanceSchema>
