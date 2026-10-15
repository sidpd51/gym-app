import type { FastifyInstance } from 'fastify';
import type { ReportController } from './report.controller.js';

const REPORTS = ['overview', 'revenue', 'members', 'memberships', 'attendance', 'expenses', 'leads'];

export function reportRoutes(c: ReportController) {
  return async (app: FastifyInstance) => {
    for (const name of REPORTS) {
      app.get(`/reports/${name}`, { onRequest: [app.requirePermission('reports:view')] }, c.overview);
    }
  };
}
