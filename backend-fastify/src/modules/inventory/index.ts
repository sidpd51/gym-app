import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { InventoryCategoryRepository } from './inventory-category.repository.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryRepository } from './inventory.repository.js';
import { inventoryRoutes } from './inventory.routes.js';
import { InventoryService } from './inventory.service.js';

/** Composition root for the inventory module: repositories -> service -> controller -> routes. */
export function inventoryModule(ctx: ModuleContext): FastifyPluginAsync {
  const service = new InventoryService(ctx.pool, new InventoryCategoryRepository(ctx.pool), new InventoryRepository(ctx.pool));
  return inventoryRoutes(new InventoryController(service));
}
