import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { createMembershipSchema } from './membership.schemas.js';
import type { MembershipService } from './membership.service.js';

/** HTTP adapter for /memberships. */
export class MembershipController {
  constructor(private readonly svc: MembershipService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    if (query.memberId && !z.uuid().safeParse(query.memberId).success) {
      throw badRequest('INVALID_UUID', 'Invalid memberId.');
    }
    return this.svc.list(parsePageQuery(query), { status: query.status || undefined, memberId: query.memberId || undefined });
  };

  get = async (req: FastifyRequest) => this.svc.getById(uuidParam(req, 'id', 'Invalid id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(createMembershipSchema, req.body);
    return reply.status(201).send(await this.svc.create(actorId(req), body));
  };
}
