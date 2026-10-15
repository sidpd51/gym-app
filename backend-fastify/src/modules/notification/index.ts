import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';

// STUB — to be replaced by the real port.
export function notificationModule(_ctx: ModuleContext): FastifyPluginAsync {
  return async () => {};
}

import type { Scheduler } from '../../common/scheduler.js';
export function registerNotificationJobs(
  _sched: Scheduler,
  _ctx: ModuleContext,
  _dailyBackup: (() => Promise<void>) | null,
): void {}
