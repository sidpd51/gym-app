import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { decimalInput } from './decimal.js';
import type { PlanService } from './service.js';

const status = z.enum(['ACTIVE', 'INACTIVE']);

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  durationInDays: z.number().int().gte(1),
  price: decimalInput,
  status: status.nullish(),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  description: z.string().nullish(),
  durationInDays: z.number().int().gte(1).nullish(),
  price: decimalInput.nullish(),
  status: status.nullish(),
});

export function planRoutes(svc: PlanService) {
  return async (app: FastifyInstance) => {
    app.get('/membership-plans', { onRequest: [app.requirePermission('membership-plans:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      return svc.list(parsePageQuery(query), { status: query.status || undefined });
    });

    app.get('/membership-plans/:id', { onRequest: [app.requirePermission('membership-plans:view')] }, async (req) =>
      svc.getByID(uuidParam(req, 'id', 'Invalid plan id.')),
    );

    app.post('/membership-plans', { onRequest: [app.requirePermission('membership-plans:create')] }, async (req, reply) => {
      const body = parse(createPlanSchema, req.body);
      return reply.status(201).send(await svc.create(actorId(req), body));
    });

    app.patch('/membership-plans/:id', { onRequest: [app.requirePermission('membership-plans:edit')] }, async (req) => {
      const id = uuidParam(req, 'id', 'Invalid plan id.');
      return svc.update(actorId(req), id, parse(updatePlanSchema, req.body));
    });

    app.delete('/membership-plans/:id', { onRequest: [app.requirePermission('membership-plans:delete')] }, async (req, reply) => {
      await svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid plan id.'));
      return reply.status(204).send();
    });
  };
}
