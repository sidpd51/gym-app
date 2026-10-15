import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { NotificationController } from './notification.controller.js';
import { NotificationRepository } from './notification.repository.js';
import { notificationRoutes } from './notification.routes.js';
import { NotificationService } from './notification.service.js';

export { registerNotificationJobs } from './jobs.js';

/** Composition root for the notification module: repository -> service -> controller -> routes. */
export function notificationModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new NotificationRepository(ctx.pool);
  const service = new NotificationService(ctx.pool, repo);
  return notificationRoutes(new NotificationController(service));
}
