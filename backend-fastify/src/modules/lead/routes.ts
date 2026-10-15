import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { LeadService } from './service.js';

const email = z.union([z.literal(''), z.email().max(255)]).nullish();
const source = z.enum(['WALK_IN', 'PHONE', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER']).nullish();

export const createLeadSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email,
  source,
  interestedPlanId: z.uuid().nullish(),
  notes: z.string().nullish(),
  nextFollowUpDate: dateString.nullish(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(100).nullish(),
  phone: z.string().max(20).nullish(),
  email,
  source,
  interestedPlanId: z.uuid().nullish(),
  status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'LOST']).nullish(),
  notes: z.string().nullish(),
  lastFollowUpDate: dateString.nullish(),
  nextFollowUpDate: dateString.nullish(),
});

const convertSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  joiningDate: dateString,
  phone: z.string().regex(/^\d{10}$/),
});

export function leadRoutes(svc: LeadService) {
  return async (app: FastifyInstance) => {
    app.get('/leads', { onRequest: [app.requirePermission('leads:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      return svc.list(parsePageQuery(query), { status: query.status || undefined });
    });
    app.get('/leads/:id', { onRequest: [app.requirePermission('leads:view')] }, async (req) =>
      svc.getByID(uuidParam(req, 'id', 'Invalid id.')),
    );
    app.post('/leads', { onRequest: [app.requirePermission('leads:create')] }, async (req, reply) => {
      const body = parse(createLeadSchema, req.body);
      return reply.status(201).send(await svc.create(actorId(req), body));
    });
    app.patch('/leads/:id', { onRequest: [app.requirePermission('leads:edit')] }, async (req) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      return svc.update(actorId(req), id, parse(updateLeadSchema, req.body));
    });
    app.delete('/leads/:id', { onRequest: [app.requirePermission('leads:delete')] }, async (req, reply) => {
      await svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
      return reply.status(204).send();
    });
    app.post('/leads/:id/convert', { onRequest: [app.requirePermission('leads:edit')] }, async (req, reply) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      const body = parse(convertSchema, req.body);
      return reply.status(201).send({ memberId: await svc.convert(actorId(req), id, body) });
    });
  };
}
