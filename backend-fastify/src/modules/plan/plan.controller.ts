import type { FastifyReply, FastifyRequest } from 'fastify';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { createPlanSchema, updatePlanSchema } from './plan.schemas.js';
import type { PlanService } from './plan.service.js';

/** HTTP adapter for /membership-plans. */
export class PlanController {
  constructor(private readonly svc: PlanService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    return this.svc.list(parsePageQuery(query), { status: query.status || undefined });
  };

  get = async (req: FastifyRequest) => this.svc.getById(uuidParam(req, 'id', 'Invalid plan id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(createPlanSchema, req.body);
    return reply.status(201).send(await this.svc.create(actorId(req), body));
  };

  update = async (req: FastifyRequest) => {
    const id = uuidParam(req, 'id', 'Invalid plan id.');
    return this.svc.update(actorId(req), id, parse(updatePlanSchema, req.body));
  };

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid plan id.'));
    return reply.status(204).send();
  };
}
