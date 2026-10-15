import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { notificationRoutes } from './routes.js';
import { NotificationService } from './service.js';

export { registerNotificationJobs } from './jobs.js';

export function notificationModule(ctx: ModuleContext): FastifyPluginAsync {
  return notificationRoutes(new NotificationService(ctx.pool));
}
