import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { planRoutes } from './routes.js';
import { PlanService } from './service.js';

export function planModule(ctx: ModuleContext): FastifyPluginAsync {
  return planRoutes(new PlanService(ctx.pool));
}
