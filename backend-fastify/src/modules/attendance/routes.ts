import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { parse } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { AttendanceService } from './service.js';

export const markAttendanceSchema = z.object({ memberId: z.uuid() });

export function attendanceRoutes(svc: AttendanceService) {
  return async (app: FastifyInstance) => {
    app.get('/attendance', { onRequest: [app.requirePermission('attendance:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      if (query.memberId && !z.uuid().safeParse(query.memberId).success) {
        throw badRequest('INVALID_UUID', 'Invalid memberId.');
      }
      const q = parsePageQuery(query);
      return svc.list(q, { memberId: query.memberId || undefined, from: q.fromDate || undefined, to: q.toDate || undefined });
    });

    app.post('/attendance', { onRequest: [app.requirePermission('attendance:mark')] }, async (req, reply) => {
      const body = parse(markAttendanceSchema, req.body);
      return reply.status(201).send(await svc.mark(actorId(req), body));
    });
  };
}
