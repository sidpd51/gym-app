import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { expenseRoutes } from './routes.js';
import { ExpenseService } from './service.js';

export function expenseModule(ctx: ModuleContext): FastifyPluginAsync {
  return expenseRoutes(new ExpenseService(ctx.pool));
}
