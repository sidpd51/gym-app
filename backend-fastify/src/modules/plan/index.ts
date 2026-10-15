import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { PlanController } from './plan.controller.js';
import { PlanRepository } from './plan.repository.js';
import { planRoutes } from './plan.routes.js';
import { PlanService } from './plan.service.js';

/** Composition root: repository -> service -> controller -> routes. */
export function planModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new PlanRepository(ctx.pool);
  const service = new PlanService(ctx.pool, repo);
  return planRoutes(new PlanController(service));
}
