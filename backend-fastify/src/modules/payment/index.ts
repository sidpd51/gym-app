import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { PaymentController } from './payment.controller.js';
import { PaymentRepository } from './payment.repository.js';
import { paymentRoutes } from './payment.routes.js';
import { PaymentService } from './payment.service.js';

/** Composition root: repository -> service -> controller -> routes. */
export function paymentModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new PaymentRepository(ctx.pool);
  const service = new PaymentService(ctx.pool, repo);
  return paymentRoutes(new PaymentController(service));
}
