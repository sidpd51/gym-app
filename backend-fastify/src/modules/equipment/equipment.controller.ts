import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import {
  categorySchema, categoryUpdateSchema, equipmentSchema, equipmentUpdateSchema, maintenanceSchema,
} from './equipment.schemas.js';
import type { EquipmentService } from './equipment.service.js';

/** HTTP adapter: parses/validates the request, calls the service, shapes the reply. No business rules. */
export class EquipmentController {
  constructor(private readonly svc: EquipmentService) {}

  // categories
  listCategories = async () => this.svc.listCategories();

  createCategory = async (req: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await this.svc.createCategory(actorId(req), parse(categorySchema, req.body)));

  updateCategory = async (req: FastifyRequest) => {
    const id = uuidParam(req, 'id', 'Invalid id.');
    return this.svc.updateCategory(actorId(req), id, parse(categoryUpdateSchema, req.body));
  };

  removeCategory = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.deleteCategory(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
    return reply.status(204).send();
  };

  // equipment
  list = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    if (query.categoryId && !z.uuid().safeParse(query.categoryId).success) {
      throw badRequest('INVALID_UUID', 'Invalid categoryId.');
    }
    return this.svc.listEquipment(parsePageQuery(query), {
      status: query.status || undefined,
      categoryId: query.categoryId || undefined,
    });
  };

  get = async (req: FastifyRequest) => this.svc.getEquipment(uuidParam(req, 'id', 'Invalid id.'));

  create = async (req: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await this.svc.createEquipment(actorId(req), parse(equipmentSchema, req.body)));

  update = async (req: FastifyRequest) => {
    const id = uuidParam(req, 'id', 'Invalid id.');
    return this.svc.updateEquipment(actorId(req), id, parse(equipmentUpdateSchema, req.body));
  };

  remove = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.deleteEquipment(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
    return reply.status(204).send();
  };

  // maintenance
  listMaintenance = async (req: FastifyRequest) => this.svc.listMaintenance(uuidParam(req, 'id', 'Invalid id.'));

  addMaintenance = async (req: FastifyRequest, reply: FastifyReply) => {
    const id = uuidParam(req, 'id', 'Invalid id.');
    return reply.status(201).send(await this.svc.addMaintenance(actorId(req), id, parse(maintenanceSchema, req.body)));
  };
}
