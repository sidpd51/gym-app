import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { TrainerController } from './trainer.controller.js';
import { TrainerRepository } from './trainer.repository.js';
import { trainerRoutes } from './trainer.routes.js';
import { TrainerService } from './trainer.service.js';

/** Composition root for the trainer module: repository -> service -> controller -> routes. */
export function trainerModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new TrainerRepository(ctx.pool);
  const service = new TrainerService(ctx.pool, repo);
  return trainerRoutes(new TrainerController(service));
}
