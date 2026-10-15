import type { FastifyReply, FastifyRequest } from 'fastify';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { convertLeadSchema, createLeadSchema, updateLeadSchema } from './lead.schemas.js';
import type { LeadService } from './lead.service.js';

/** HTTP adapter: parses/validates the request, calls the service, shapes the reply. No business rules. */
export class LeadController {
  constructor(private readonly svc: LeadService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    return this.svc.list(parsePageQuery(query), { status: query.status || undefined });
  };

  get = async (req: FastifyRequest) => this.svc.getById(uuidParam(req, 'id', 'Invalid id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(createLeadSchema, req.body);
    return reply.status(201).send(await this.svc.create(actorId(req), body));
  };

  update = async (req: FastifyRequest) => {
    const id = uuidParam(req, 'id', 'Invalid id.');
    return this.svc.update(actorId(req), id, parse(updateLeadSchema, req.body));
  };

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
    return reply.status(204).send();
  };

  convert = async (req: FastifyRequest, reply: FastifyReply) => {
    const id = uuidParam(req, 'id', 'Invalid id.');
    const body = parse(convertLeadSchema, req.body);
    return reply.status(201).send({ memberId: await this.svc.convert(actorId(req), id, body) });
  };
}
