import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { ReportController } from './report.controller.js';
import { ReportRepository } from './report.repository.js';
import { reportRoutes } from './report.routes.js';
import { ReportService } from './report.service.js';

export function reportModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new ReportRepository(ctx.pool);
  return reportRoutes(new ReportController(new ReportService(repo)));
}
