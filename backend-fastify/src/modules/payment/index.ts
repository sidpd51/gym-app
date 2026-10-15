import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { paymentRoutes } from './routes.js';
import { PaymentService } from './service.js';

export function paymentModule(ctx: ModuleContext): FastifyPluginAsync {
  return paymentRoutes(new PaymentService(ctx.pool));
}
