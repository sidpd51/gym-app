import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';
import { SettingsController } from './settings.controller.js';
import { SettingsRepository } from './settings.repository.js';
import { settingsRoutes } from './settings.routes.js';
import { SettingsService } from './settings.service.js';

export function settingsModule(ctx: ModuleContext): FastifyPluginAsync {
  const repo = new SettingsRepository(ctx.pool);
  return settingsRoutes(new SettingsController(new SettingsService(ctx.pool, repo)));
}
