import type { FastifyPluginAsync } from 'fastify';
import { attendanceModule } from './attendance/index.js';
import { auditModule } from './audit/index.js';
import { backupModule } from './backup/index.js';
import type { ModuleContext } from './context.js';
import { equipmentModule } from './equipment/index.js';
import { expenseModule } from './expense/index.js';
import { inventoryModule } from './inventory/index.js';
import { leadModule } from './lead/index.js';
import { memberModule } from './member/index.js';
import { membershipModule } from './membership/index.js';
import { notificationModule } from './notification/index.js';
import { paymentModule } from './payment/index.js';
import { planModule } from './plan/index.js';
import { reportModule } from './report/index.js';
import { searchModule } from './search/index.js';
import { settingsModule } from './settings/index.js';
import { trainerModule } from './trainer/index.js';

/** Authenticated feature modules, mounted under /api/v1 behind CSRF + session auth. */
export const featureModules: Array<(ctx: ModuleContext) => FastifyPluginAsync> = [
  memberModule, planModule, membershipModule, paymentModule, attendanceModule, trainerModule,
  leadModule, expenseModule, inventoryModule, equipmentModule, notificationModule,
  reportModule, settingsModule, auditModule, searchModule, backupModule,
];
