import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { trainerRoutes } from './routes.js';
import { TrainerService } from './service.js';

export function trainerModule(ctx: ModuleContext): FastifyPluginAsync {
  return trainerRoutes(new TrainerService(ctx.pool));
}
