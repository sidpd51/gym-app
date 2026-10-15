import type { FastifyInstance } from 'fastify';
import type { MemberController } from './member.controller.js';

/** Route table: path + method + permission -> controller action. */
export function memberRoutes(c: MemberController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/members', perm('members:view'), c.list);
    app.get('/members/:id', perm('members:view'), c.get);
    app.get('/members/:id/details', perm('members:view'), c.details);
    app.post('/members', perm('members:create'), c.create);
    app.patch('/members/:id', perm('members:edit'), c.update);
    app.delete('/members/:id', perm('members:delete'), c.remove);
  };
}
