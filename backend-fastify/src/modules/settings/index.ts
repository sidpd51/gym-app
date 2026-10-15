import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { parse } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { ModuleContext } from '../context.js';
import { SettingsService } from './service.js';

export const settingsSchema = z.object({
  gymName: z.string().max(100).nullish(),
  phone: z.string().max(20).nullish(),
  email: z.email().max(255).nullish(),
  address: z.string().nullish(),
  currency: z.string().length(3).nullish(),
  timezone: z.string().max(50).nullish(),
  dateFormat: z.string().max(20).nullish(),
  membershipGracePeriodDays: z.number().int().min(0).max(2147483647).nullish(),
  attendanceStartTime: z.string().length(5).nullish(),
  attendanceEndTime: z.string().length(5).nullish(),
  allowAttendanceForExpiredMembership: z.boolean().nullish(),
});

export function settingsModule(ctx: ModuleContext): FastifyPluginAsync {
  const svc = new SettingsService(ctx.pool);
  return async (app) => {
    app.get('/settings', { onRequest: [app.requirePermission('settings:view')] }, async () => svc.get());
    app.patch('/settings', { onRequest: [app.requirePermission('settings:edit')] }, async (req) =>
      svc.update(actorId(req), parse(settingsSchema, req.body)),
    );
  };
}
