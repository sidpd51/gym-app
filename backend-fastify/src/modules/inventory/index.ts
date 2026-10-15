import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { inventoryRoutes } from './routes.js';
import { InventoryService } from './service.js';

export function inventoryModule(ctx: ModuleContext): FastifyPluginAsync {
  return inventoryRoutes(new InventoryService(ctx.pool));
}
