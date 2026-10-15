import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { BackupController } from './backup.controller.js';
import { backupRoutes } from './backup.routes.js';
import { BackupService } from './backup.service.js';

// Re-exported: src/server.ts uses BackupService for the daily_backup job.
export { BackupService } from './backup.service.js';
export type { BackupFile } from './backup.model.js';

export function backupModule(ctx: ModuleContext): FastifyPluginAsync {
  return backupRoutes(new BackupController(new BackupService(ctx)));
}
