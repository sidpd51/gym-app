import type { FastifyInstance } from 'fastify';
import type { LeadController } from './lead.controller.js';

/** Route table: path + method + permission -> controller action. */
export function leadRoutes(c: LeadController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/leads', perm('leads:view'), c.list);
    app.get('/leads/:id', perm('leads:view'), c.get);
    app.post('/leads', perm('leads:create'), c.create);
    app.patch('/leads/:id', perm('leads:edit'), c.update);
    app.delete('/leads/:id', perm('leads:delete'), c.remove);
    app.post('/leads/:id/convert', perm('leads:edit'), c.convert);
  };
}
