import type { FastifyReply, FastifyRequest } from 'fastify';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { createUserSchema, updateUserSchema } from './user.schemas.js';
import type { UserService } from './user.service.js';

/** HTTP adapter for /users. */
export class UserController {
  constructor(private readonly svc: UserService) {}

  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    return this.svc.list(parsePageQuery(query), { role: query.role, status: query.status });
  };

  get = async (req: FastifyRequest) => this.svc.getById(uuidParam(req, 'id', 'Invalid user id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = parse(createUserSchema, req.body);
    return reply.status(201).send(await this.svc.create(actorId(req), body));
  };

  update = async (req: FastifyRequest) => {
    const id = uuidParam(req, 'id', 'Invalid user id.');
    return this.svc.update(actorId(req), id, parse(updateUserSchema, req.body));
  };

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid user id.'));
    return reply.status(204).send();
  };
}
