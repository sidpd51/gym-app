import type { FastifyInstance } from 'fastify';
import type { PlanController } from './plan.controller.js';

/** Route table for /membership-plans. */
export function planRoutes(c: PlanController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/membership-plans', perm('membership-plans:view'), c.list);
    app.get('/membership-plans/:id', perm('membership-plans:view'), c.get);
    app.post('/membership-plans', perm('membership-plans:create'), c.create);
    app.patch('/membership-plans/:id', perm('membership-plans:edit'), c.update);
    app.delete('/membership-plans/:id', perm('membership-plans:delete'), c.remove);
  };
}
