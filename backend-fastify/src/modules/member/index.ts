import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { MemberController } from './member.controller.js';
import { MemberRepository } from './member.repository.js';
import { memberRoutes } from './member.routes.js';
import { MemberService } from './member.service.js';

/** Composition root for the member module: repository -> service -> controller -> routes. */
export function memberModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new MemberRepository(ctx.pool);
  const service = new MemberService(ctx.pool, repo);
  return memberRoutes(new MemberController(service));
}
