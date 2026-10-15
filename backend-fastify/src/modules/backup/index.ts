import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';

// STUB — to be replaced by the real port.
export function backupModule(_ctx: ModuleContext): FastifyPluginAsync {
  return async () => {};
}

/** Used by the daily_backup scheduled job. `create(true)` is idempotent per calendar day. */
export class BackupService {
  constructor(_ctx: ModuleContext) {}
  async create(_idempotentDaily: boolean): Promise<{ name: string; sizeBytes: number; createdAt: Date }> {
    throw new Error('not implemented');
  }
}
