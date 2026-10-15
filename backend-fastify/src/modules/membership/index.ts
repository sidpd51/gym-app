import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { membershipRoutes } from './routes.js';
import { MembershipService } from './service.js';

export function membershipModule(ctx: ModuleContext): FastifyPluginAsync {
  return membershipRoutes(new MembershipService(ctx.pool));
}
