import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { badRequest } from '../../common/errors.js';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { ExpenseService } from './service.js';

const status = z.enum(['ACTIVE', 'INACTIVE']);
const method = z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']);
/** Go's decimal.Decimal accepts JSON numbers or numeric strings. */
const amount = z
  .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .transform((v) => String(v));

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  status: status.nullish(),
});
// Go does no validation on category update; empty name simply means "unchanged".
const updateCategorySchema = z.object({
  name: z.string().nullish(),
  description: z.string().nullish(),
  status: status.nullish(),
});
const createExpenseSchema = z.object({
  categoryId: z.uuid(),
  description: z.string().min(1),
  amount,
  expenseDate: dateString,
  paymentMethod: method,
  vendor: z.string().max(100).nullish(),
  notes: z.string().nullish(),
});
const updateExpenseSchema = z.object({
  categoryId: z.uuid().nullish(),
  description: z.string().nullish(),
  amount: amount.nullish(),
  expenseDate: dateString.nullish(),
  paymentMethod: method.nullish(),
  vendor: z.string().nullish(),
  notes: z.string().nullish(),
});

export function expenseRoutes(svc: ExpenseService) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<typeof app.requirePermission>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/expense-categories', perm('expenses:view'), async () => svc.listCategories());
    app.post('/expense-categories', perm('expenses:create'), async (req, reply) =>
      reply.status(201).send(await svc.createCategory(actorId(req), parse(createCategorySchema, req.body))),
    );
    app.patch('/expense-categories/:id', perm('expenses:edit'), async (req) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      return svc.updateCategory(actorId(req), id, parse(updateCategorySchema, req.body));
    });
    app.delete('/expense-categories/:id', perm('expenses:delete'), async (req, reply) => {
      await svc.deleteCategory(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
      return reply.status(204).send();
    });

    app.get('/expenses', perm('expenses:view'), async (req) => {
      const query = req.query as Record<string, string>;
      const q = parsePageQuery(query);
      let categoryId: string | undefined;
      if (query.categoryId) {
        if (!z.uuid().safeParse(query.categoryId).success) throw badRequest('INVALID_UUID', 'Invalid categoryId.');
        categoryId = query.categoryId;
      }
      return svc.listExpenses(q, { categoryId, from: q.fromDate || undefined, to: q.toDate || undefined });
    });
    app.get('/expenses/:id', perm('expenses:view'), async (req) =>
      svc.getExpense(uuidParam(req, 'id', 'Invalid id.')),
    );
    app.post('/expenses', perm('expenses:create'), async (req, reply) =>
      reply.status(201).send(await svc.createExpense(actorId(req), parse(createExpenseSchema, req.body))),
    );
    app.patch('/expenses/:id', perm('expenses:edit'), async (req) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      return svc.updateExpense(actorId(req), id, parse(updateExpenseSchema, req.body));
    });
    app.delete('/expenses/:id', perm('expenses:delete'), async (req, reply) => {
      await svc.deleteExpense(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
      return reply.status(204).send();
    });
  };
}
