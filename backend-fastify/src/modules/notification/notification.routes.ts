import type { FastifyInstance } from 'fastify';
import type { NotificationController } from './notification.controller.js';

/** Route table: path + method + permission -> controller action. */
export function notificationRoutes(c: NotificationController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/notifications', perm('notifications:view'), c.list);
    app.get('/notifications/expiring', perm('notifications:view'), c.expiring);
    app.get('/notifications/expired', perm('notifications:view'), c.expired);
    app.post('/notifications', perm('notifications:create'), c.create);
  };
}
