import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { SearchController } from './search.controller.js';
import { SearchRepository } from './search.repository.js';
import { searchRoutes } from './search.routes.js';
import { SearchService } from './search.service.js';

export function searchModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new SearchRepository(ctx.pool);
  return searchRoutes(new SearchController(new SearchService(repo)));
}
