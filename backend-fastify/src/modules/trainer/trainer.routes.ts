import type { FastifyInstance } from 'fastify';
import type { TrainerController } from './trainer.controller.js';

/** Route table: path + method + permission -> controller action. */
export function trainerRoutes(c: TrainerController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/trainers', perm('trainers:view'), c.list);
    app.get('/trainers/:id', perm('trainers:view'), c.get);
    app.post('/trainers', perm('trainers:create'), c.create);
    app.patch('/trainers/:id', perm('trainers:edit'), c.update);
    app.delete('/trainers/:id', perm('trainers:delete'), c.remove);

    // Member -> trainer assignment
    app.get('/members/:memberId/trainer', perm('members:view'), c.getAssignment);
    app.post('/members/:memberId/trainer', perm('members:edit'), c.assign);
    app.delete('/members/:memberId/trainer', perm('members:edit'), c.endAssignment);
  };
}
