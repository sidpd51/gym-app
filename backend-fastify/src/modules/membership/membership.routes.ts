import type { FastifyInstance } from 'fastify';
import type { MembershipController } from './membership.controller.js';

/** Route table for /memberships. */
export function membershipRoutes(c: MembershipController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/memberships', perm('memberships:view'), c.list);
    app.get('/memberships/:id', perm('memberships:view'), c.get);
    app.post('/memberships', perm('memberships:create'), c.create);
  };
}
