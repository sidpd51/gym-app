import type { FastifyReply, FastifyRequest } from 'fastify';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { createMemberSchema, updateMemberSchema } from './member.schemas.js';
import type { MemberService } from './member.service.js';

/** HTTP adapter: parses/validates the request, calls the service, shapes the reply. No business rules. */
export class MemberController {
  constructor(private readonly svc: MemberService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    return this.svc.list(parsePageQuery(query), { status: query.status || undefined });
  };

  get = async (req: FastifyRequest) => this.svc.getById(uuidParam(req, 'id', 'Invalid member id.'));

  details = async (req: FastifyRequest) => this.svc.details(uuidParam(req, 'id', 'Invalid member id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(createMemberSchema, req.body);
    return reply.status(201).send(await this.svc.create(actorId(req), body));
  };

  update = async (req: FastifyRequest) => {
    const id = uuidParam(req, 'id', 'Invalid member id.');
    return this.svc.update(actorId(req), id, parse(updateMemberSchema, req.body));
  };

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid member id.'));
    return reply.status(204).send();
  };
}
