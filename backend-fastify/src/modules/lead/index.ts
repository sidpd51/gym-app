import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { leadRoutes } from './routes.js';
import { LeadService } from './service.js';

export function leadModule(ctx: ModuleContext): FastifyPluginAsync {
  return leadRoutes(new LeadService(ctx.pool));
}
