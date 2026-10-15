import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import {
  createCategorySchema, createItemSchema, transactionSchema, updateCategorySchema, updateItemSchema,
} from './inventory.schemas.js';
import type { InventoryService } from './inventory.service.js';

const id = (req: FastifyRequest) => uuidParam(req, 'id', 'Invalid id.');

/** HTTP adapter for inventory categories, items and stock transactions. No business rules. */
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  listCategories = async () => this.svc.listCategories();

  createCategory = async (req: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await this.svc.createCategory(actorId(req), parse(createCategorySchema, req.body)));

  updateCategory = async (req: FastifyRequest) =>
    this.svc.updateCategory(actorId(req), id(req), parse(updateCategorySchema, req.body));

  removeCategory = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.deleteCategory(actorId(req), id(req));
    return reply.status(204).send();
  };

  listItems = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    if (query.categoryId && !z.uuid().safeParse(query.categoryId).success) {
      throw badRequest('INVALID_UUID', 'Invalid categoryId.');
    }
    return this.svc.listItems(parsePageQuery(query), {
      status: query.status || undefined,
      categoryId: query.categoryId || undefined,
    });
  };

  getItem = async (req: FastifyRequest) => this.svc.getItem(id(req));

  createItem = async (req: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await this.svc.createItem(actorId(req), parse(createItemSchema, req.body)));

  updateItem = async (req: FastifyRequest) =>
    this.svc.updateItem(actorId(req), id(req), parse(updateItemSchema, req.body));

  removeItem = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.deleteItem(actorId(req), id(req));
    return reply.status(204).send();
  };

  listTransactions = async (req: FastifyRequest) => this.svc.listTransactions(id(req));

  recordTransaction = async (req: FastifyRequest, reply: FastifyReply) => {
    const itemId = id(req);
    return reply.status(201).send(await this.svc.recordTransaction(actorId(req), itemId, parse(transactionSchema, req.body)));
  };
}
