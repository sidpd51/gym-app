import type { FastifyInstance } from 'fastify';
import type { AttendanceController } from './attendance.controller.js';

/** Route table for /attendance. */
export function attendanceRoutes(c: AttendanceController) {
  return async (app: FastifyInstance) => {
    const perm = (p: Parameters<FastifyInstance['requirePermission']>[0]) => ({ onRequest: [app.requirePermission(p)] });

    app.get('/attendance', perm('attendance:view'), c.list);
    app.post('/attendance', perm('attendance:mark'), c.mark);
  };
}
