import type { FastifyReply, FastifyRequest } from 'fastify';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { assignTrainerSchema, createTrainerSchema, updateTrainerSchema } from './trainer.schemas.js';
import type { TrainerService } from './trainer.service.js';

/** HTTP adapter: parses/validates the request, calls the service, shapes the reply. No business rules. */
export class TrainerController {
  constructor(private readonly svc: TrainerService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    return this.svc.list(parsePageQuery(query), { status: query.status || undefined });
  };

  get = async (req: FastifyRequest) => this.svc.getById(uuidParam(req, 'id', 'Invalid id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(createTrainerSchema, req.body);
    return reply.status(201).send(await this.svc.create(actorId(req), body));
  };

  update = async (req: FastifyRequest) => {
    const id = uuidParam(req, 'id', 'Invalid id.');
    return this.svc.update(actorId(req), id, parse(updateTrainerSchema, req.body));
  };

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
    return reply.status(204).send();
  };

  getAssignment = async (req: FastifyRequest) =>
    this.svc.getAssignmentForMember(uuidParam(req, 'memberId', 'Invalid memberId.'));

  assign = async (req: FastifyRequest, reply: FastifyReply) => {
    const memberId = uuidParam(req, 'memberId', 'Invalid memberId.');
    const body = parse(assignTrainerSchema, req.body);
    return reply.status(201).send(await this.svc.assign(actorId(req), memberId, body.trainerId));
  };

  endAssignment = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.endAssignment(actorId(req), uuidParam(req, 'memberId', 'Invalid memberId.'));
    return reply.status(204).send();
  };
}
