import type { FastifyInstance } from 'fastify';
import type { BackupController } from './backup.controller.js';

export function backupRoutes(c: BackupController) {
  return async (app: FastifyInstance) => {
    // OWNER-only via settings:edit (which only OWNER has).
    const guard = { onRequest: [app.requirePermission('settings:edit')] };

    app.post('/backup/create', guard, c.create);
    app.get('/backup/list', guard, c.list);

    // Raw-body upload: own scope so the catch-all stream parser doesn't affect other routes.
    await app.register(async (up) => {
      up.removeAllContentTypeParsers();
      up.addContentTypeParser('*', (_req, payload, done) => done(null, payload));
      up.post('/backup/restore', { ...guard, bodyLimit: 4 * 1024 ** 3 }, c.restore);
    });
  };
}
