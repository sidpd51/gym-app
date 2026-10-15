import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { AuditController } from './audit.controller.js';
import { AuditRepository } from './audit.repository.js';
import { auditRoutes } from './audit.routes.js';
import { AuditService } from './audit.service.js';

export function auditModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new AuditRepository(ctx.pool);
  return auditRoutes(new AuditController(new AuditService(repo)));
}
