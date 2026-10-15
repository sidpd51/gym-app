import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { MembershipController } from './membership.controller.js';
import { MembershipRepository } from './membership.repository.js';
import { membershipRoutes } from './membership.routes.js';
import { MembershipService } from './membership.service.js';

/** Composition root: repository -> service -> controller -> routes. */
export function membershipModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new MembershipRepository(ctx.pool);
  const service = new MembershipService(ctx.pool, repo);
  return membershipRoutes(new MembershipController(service));
}
