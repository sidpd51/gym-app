import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { LeadController } from './lead.controller.js';
import { LeadRepository } from './lead.repository.js';
import { leadRoutes } from './lead.routes.js';
import { LeadService } from './lead.service.js';

/** Composition root for the lead module: repository -> service -> controller -> routes. */
export function leadModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new LeadRepository(ctx.pool);
  const service = new LeadService(ctx.pool, repo);
  return leadRoutes(new LeadController(service));
}
