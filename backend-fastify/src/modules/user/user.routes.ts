import type { FastifyInstance } from 'fastify';
import type { UserController } from './user.controller.js';

/** Route table for /users. */
export function userRoutes(c: UserController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/users', perm('users:view'), c.list);
    app.get('/users/:id', perm('users:view'), c.get);
    app.post('/users', perm('users:create'), c.create);
    app.patch('/users/:id', perm('users:edit'), c.update);
    app.delete('/users/:id', perm('users:delete'), c.remove);
  };
}
