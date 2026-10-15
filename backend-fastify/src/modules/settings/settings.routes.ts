import type { FastifyInstance } from 'fastify';
import type { SettingsController } from './settings.controller.js';

export function settingsRoutes(c: SettingsController) {
  return async (app: FastifyInstance) => {
    app.get('/settings', { onRequest: [app.requirePermission('settings:view')] }, c.get);
    app.patch('/settings', { onRequest: [app.requirePermission('settings:edit')] }, c.update);
  };
}
