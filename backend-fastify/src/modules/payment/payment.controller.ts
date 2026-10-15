import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { createPaymentSchema } from './payment.schemas.js';
import type { PaymentService } from './payment.service.js';

/** HTTP adapter for /payments. */
export class PaymentController {
  constructor(private readonly svc: PaymentService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    if (query.memberId && !z.uuid().safeParse(query.memberId).success) {
      throw badRequest('INVALID_UUID', 'Invalid memberId.');
    }
    const q = parsePageQuery(query);
    return this.svc.list(q, {
      status: query.status || undefined,
      memberId: query.memberId || undefined,
      from: q.fromDate || undefined,
      to: q.toDate || undefined,
    });
  };

  get = async (req: FastifyRequest) => this.svc.getById(uuidParam(req, 'id', 'Invalid id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(createPaymentSchema, req.body);
    return reply.status(201).send(await this.svc.create(actorId(req), body));
  };
}
