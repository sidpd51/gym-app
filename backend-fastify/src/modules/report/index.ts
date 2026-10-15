import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { parseRange, ReportService } from './service.js';

const REPORTS = ['overview', 'revenue', 'members', 'memberships', 'attendance', 'expenses', 'leads'];

export function reportModule(ctx: ModuleContext): FastifyPluginAsync {
  const svc = new ReportService(ctx.pool);
  return async (app) => {
    // For v1 every report returns the overview payload (same as the Go service).
    for (const name of REPORTS) {
      app.get(`/reports/${name}`, { onRequest: [app.requirePermission('reports:view')] }, async (req) =>
        svc.overview(parseRange(req.query)),
      );
    }
  };
}
