import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { MembershipService } from './service.js';

export const createMembershipSchema = z.object({
  memberId: z.uuid(),
  planId: z.uuid(),
  startDate: dateString,
});

export function membershipRoutes(svc: MembershipService) {
  return async (app: FastifyInstance) => {
    app.get('/memberships', { onRequest: [app.requirePermission('memberships:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      if (query.memberId && !z.uuid().safeParse(query.memberId).success) {
        throw badRequest('INVALID_UUID', 'Invalid memberId.');
      }
      return svc.list(parsePageQuery(query), { status: query.status || undefined, memberId: query.memberId || undefined });
    });

    app.get('/memberships/:id', { onRequest: [app.requirePermission('memberships:view')] }, async (req) =>
      svc.getByID(uuidParam(req, 'id', 'Invalid id.')),
    );

    app.post('/memberships', { onRequest: [app.requirePermission('memberships:create')] }, async (req, reply) => {
      const body = parse(createMembershipSchema, req.body);
      return reply.status(201).send(await svc.create(actorId(req), body));
    });
  };
}
