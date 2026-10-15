import { z } from 'zod';

export const markAttendanceSchema = z.object({ memberId: z.uuid() });

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
