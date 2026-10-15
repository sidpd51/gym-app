import type { FastifyInstance } from 'fastify';
import type { PaymentController } from './payment.controller.js';

/** Route table for /payments. */
export function paymentRoutes(c: PaymentController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/payments', perm('payments:view'), c.list);
    app.get('/payments/:id', perm('payments:view'), c.get);
    app.post('/payments', perm('payments:record'), c.create);
  };
}
