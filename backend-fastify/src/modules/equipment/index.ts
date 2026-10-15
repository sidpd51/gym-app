import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { EquipmentController } from './equipment.controller.js';
import { EquipmentRepository } from './equipment.repository.js';
import { equipmentRoutes } from './equipment.routes.js';
import { EquipmentService } from './equipment.service.js';

/** Composition root for the equipment module: repository -> service -> controller -> routes. */
export function equipmentModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new EquipmentRepository(ctx.pool);
  const service = new EquipmentService(ctx.pool, repo);
  return equipmentRoutes(new EquipmentController(service));
}
