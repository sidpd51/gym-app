import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import {
  createCategorySchema,
  createExpenseSchema,
  updateCategorySchema,
  updateExpenseSchema,
} from './expense.schemas.js';
import type { ExpenseService } from './expense.service.js';

const id = (req: FastifyRequest) => uuidParam(req, 'id', 'Invalid id.');

/** HTTP adapter for expenses and expense categories. No business rules. */
export class ExpenseController {
  constructor(private readonly svc: ExpenseService) {}

  listCategories = async () => this.svc.listCategories();

  createCategory = async (req: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await this.svc.createCategory(actorId(req), parse(createCategorySchema, req.body)));

  updateCategory = async (req: FastifyRequest) =>
    this.svc.updateCategory(actorId(req), id(req), parse(updateCategorySchema, req.body));

  removeCategory = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.deleteCategory(actorId(req), id(req));
    return reply.status(204).send();
  };

  listExpenses = async (req: FastifyRequest) => {
    const query = req.query as Record<string, string>;
    const q = parsePageQuery(query);
    let categoryId: string | undefined;
    if (query.categoryId) {
      if (!z.uuid().safeParse(query.categoryId).success) throw badRequest('INVALID_UUID', 'Invalid categoryId.');
      categoryId = query.categoryId;
    }
    return this.svc.listExpenses(q, { categoryId, from: q.fromDate || undefined, to: q.toDate || undefined });
  };

  getExpense = async (req: FastifyRequest) => this.svc.getExpense(id(req));

  createExpense = async (req: FastifyRequest, reply: FastifyReply) =>
    reply.status(201).send(await this.svc.createExpense(actorId(req), parse(createExpenseSchema, req.body)));

  updateExpense = async (req: FastifyRequest) =>
    this.svc.updateExpense(actorId(req), id(req), parse(updateExpenseSchema, req.body));

  removeExpense = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.deleteExpense(actorId(req), id(req));
    return reply.status(204).send();
  };
}
