import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { attendanceRoutes } from './routes.js';
import { AttendanceService } from './service.js';

export function attendanceModule(ctx: ModuleContext): FastifyPluginAsync {
  return attendanceRoutes(new AttendanceService(ctx.pool));
}
