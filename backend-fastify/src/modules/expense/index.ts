import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { ExpenseCategoryRepository } from './expense-category.repository.js';
import { ExpenseController } from './expense.controller.js';
import { ExpenseRepository } from './expense.repository.js';
import { expenseRoutes } from './expense.routes.js';
import { ExpenseService } from './expense.service.js';

/** Composition root for the expense module: repositories -> service -> controller -> routes. */
export function expenseModule(ctx: ModuleContext): FastifyPluginAsync {
  const service = new ExpenseService(ctx.pool, new ExpenseCategoryRepository(ctx.pool), new ExpenseRepository(ctx.pool));
  return expenseRoutes(new ExpenseController(service));
}
