import type { FastifyReply, FastifyRequest } from 'fastify';
import { parsePageQuery } from '../../common/pagination.js';
import { parse } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { createNotificationSchema, listQuerySchema } from './notification.schemas.js';
import { DEFAULT_EXPIRY_WINDOW_DAYS, type NotificationService } from './notification.service.js';

/** HTTP adapter: parses/validates the request, calls the service, shapes the reply. No business rules. */
export class NotificationController {
  constructor(private readonly svc: NotificationService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    const { status } = parse(listQuerySchema, query);
    return this.svc.list(parsePageQuery(query), status);
  };

  expiring = async (req: FastifyRequest) => {
    const n = Number.parseInt((req.query as Record<string, string>).days ?? '', 10);
    return this.svc.expiring(Number.isNaN(n) || n <= 0 ? DEFAULT_EXPIRY_WINDOW_DAYS : n);
  };

  expired = async () => this.svc.expired();

  create = async (req: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await this.svc.create(actorId(req), parse(createNotificationSchema, req.body)));
}
