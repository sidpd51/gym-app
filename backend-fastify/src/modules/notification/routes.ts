import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePageQuery } from '../../common/pagination.js';
import { parse } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { DEFAULT_EXPIRY_WINDOW_DAYS, type NotificationService } from './service.js';

export const createNotificationSchema = z.object({
  memberId: z.uuid(),
  membershipId: z.uuid(),
  type: z.enum(['EXPIRY_REMINDER', 'EXPIRED_NOTICE', 'CUSTOM']),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP']),
  message: z.string().min(1),
});

const statusFilter = z.enum(['PENDING', 'SENT', 'FAILED']).optional();

export function notificationRoutes(svc: NotificationService) {
  return async (app: FastifyInstance) => {
    app.get('/notifications', { onRequest: [app.requirePermission('notifications:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      const status = parse(z.object({ status: z.preprocess((v) => (v === '' ? undefined : v), statusFilter) }), query).status;
      return svc.list(parsePageQuery(query), status);
    });

    app.get('/notifications/expiring', { onRequest: [app.requirePermission('notifications:view')] }, async (req) => {
      const n = Number.parseInt((req.query as Record<string, string>).days ?? '', 10);
      return svc.expiring(Number.isNaN(n) || n <= 0 ? DEFAULT_EXPIRY_WINDOW_DAYS : n);
    });

    app.get('/notifications/expired', { onRequest: [app.requirePermission('notifications:view')] }, async () => svc.expired());

    app.post('/notifications', { onRequest: [app.requirePermission('notifications:create')] }, async (req, reply) =>
      reply.status(201).send(await svc.create(actorId(req), parse(createNotificationSchema, req.body))),
    );
  };
}
