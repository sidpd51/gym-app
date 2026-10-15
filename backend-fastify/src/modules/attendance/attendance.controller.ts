import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { parse } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { markAttendanceSchema } from './attendance.schemas.js';
import type { AttendanceService } from './attendance.service.js';

/** HTTP adapter for /attendance. */
export class AttendanceController {
  constructor(private readonly svc: AttendanceService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    if (query.memberId && !z.uuid().safeParse(query.memberId).success) {
      throw badRequest('INVALID_UUID', 'Invalid memberId.');
    }
    const q = parsePageQuery(query);
    return this.svc.list(q, { memberId: query.memberId || undefined, from: q.fromDate || undefined, to: q.toDate || undefined });
  };

  mark = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(markAttendanceSchema, req.body);
    return reply.status(201).send(await this.svc.mark(actorId(req), body));
  };
}
