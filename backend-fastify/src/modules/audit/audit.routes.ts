import type { FastifyInstance } from 'fastify';
import type { AuditController } from './audit.controller.js';

export function auditRoutes(c: AuditController) {
  return async (app: FastifyInstance) => {
    const guard = { onRequest: [app.requirePermission('audit-logs:view')] };
    app.get('/audit-logs', guard, c.list);
    app.get('/audit-logs/:id', guard, c.get);
  };
}
