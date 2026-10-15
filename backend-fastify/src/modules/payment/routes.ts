import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { decimalInput } from '../plan/decimal.js';
import type { PaymentService } from './service.js';

export const createPaymentSchema = z.object({
  memberId: z.uuid(),
  membershipId: z.uuid().nullish(),
  amount: decimalInput,
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']),
  paymentDate: dateString,
  status: z.enum(['COMPLETED', 'PENDING', 'REFUNDED']).nullish(),
  reference: z.string().max(100).nullish(),
  notes: z.string().nullish(),
});

export function paymentRoutes(svc: PaymentService) {
  return async (app: FastifyInstance) => {
    app.get('/payments', { onRequest: [app.requirePermission('payments:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      if (query.memberId && !z.uuid().safeParse(query.memberId).success) {
        throw badRequest('INVALID_UUID', 'Invalid memberId.');
      }
      const q = parsePageQuery(query);
      return svc.list(q, {
        status: query.status || undefined,
        memberId: query.memberId || undefined,
        from: q.fromDate || undefined,
        to: q.toDate || undefined,
      });
    });

    app.get('/payments/:id', { onRequest: [app.requirePermission('payments:view')] }, async (req) =>
      svc.getByID(uuidParam(req, 'id', 'Invalid id.')),
    );

    app.post('/payments', { onRequest: [app.requirePermission('payments:record')] }, async (req, reply) => {
      const body = parse(createPaymentSchema, req.body);
      return reply.status(201).send(await svc.create(actorId(req), body));
    });
  };
}
