import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceRepository } from './attendance.repository.js';
import { attendanceRoutes } from './attendance.routes.js';
import { AttendanceService } from './attendance.service.js';

/** Composition root: repository -> service -> controller -> routes. */
export function attendanceModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new AttendanceRepository(ctx.pool);
  const service = new AttendanceService(ctx.pool, repo);
  return attendanceRoutes(new AttendanceController(service));
}
