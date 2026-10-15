import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { MemberService } from './service.js';

const optStr = (max: number) => z.string().max(max).nullish();
const optDate = dateString.nullish();

export const createMemberSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().regex(/^\d{10}$/),
  email: z.union([z.literal(''), z.email().max(255)]).nullish(),
  joiningDate: dateString,
  dateOfBirth: optDate,
  gender: optStr(10),
  address: z.string().nullish(),
  emergencyContactName: optStr(100),
  emergencyContactPhone: optStr(20),
  emergencyContactRelationship: optStr(50),
});

export const updateMemberSchema = z.object({
  firstName: z.string().min(1).max(50).nullish(),
  lastName: z.string().min(1).max(50).nullish(),
  email: z.union([z.literal(''), z.email().max(255)]).nullish(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']).nullish(),
  dateOfBirth: optDate,
  gender: optStr(10),
  address: z.string().nullish(),
  emergencyContactName: optStr(100),
  emergencyContactPhone: optStr(20),
  emergencyContactRelationship: optStr(50),
});

export function memberRoutes(svc: MemberService) {
  return async (app: FastifyInstance) => {
    app.get('/members', { onRequest: [app.requirePermission('members:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      return svc.list(parsePageQuery(query), { status: query.status || undefined });
    });

    app.get('/members/:id', { onRequest: [app.requirePermission('members:view')] }, async (req) =>
      svc.getByID(uuidParam(req, 'id', 'Invalid member id.')),
    );

    app.get('/members/:id/details', { onRequest: [app.requirePermission('members:view')] }, async (req) =>
      svc.details(uuidParam(req, 'id', 'Invalid member id.')),
    );

    app.post('/members', { onRequest: [app.requirePermission('members:create')] }, async (req, reply) => {
      const body = parse(createMemberSchema, req.body);
      return reply.status(201).send(await svc.create(actorId(req), body));
    });

    app.patch('/members/:id', { onRequest: [app.requirePermission('members:edit')] }, async (req) => {
      const id = uuidParam(req, 'id', 'Invalid member id.');
      return svc.update(actorId(req), id, parse(updateMemberSchema, req.body));
    });

    app.delete('/members/:id', { onRequest: [app.requirePermission('members:delete')] }, async (req, reply) => {
      await svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid member id.'));
      return reply.status(204).send();
    });
  };
}
