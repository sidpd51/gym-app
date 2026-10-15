import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { equipmentRoutes } from './routes.js';
import { EquipmentService } from './service.js';

export function equipmentModule(ctx: ModuleContext): FastifyPluginAsync {
  return equipmentRoutes(new EquipmentService(ctx.pool));
}
