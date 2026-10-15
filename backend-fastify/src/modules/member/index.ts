import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { memberRoutes } from './routes.js';
import { MemberService } from './service.js';

export function memberModule(ctx: ModuleContext): FastifyPluginAsync {
  return memberRoutes(new MemberService(ctx.pool));
}
