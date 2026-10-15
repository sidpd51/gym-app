import type { FastifyRequest } from 'fastify';
import { parse } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import { settingsSchema } from './settings.schemas.js';
import type { SettingsService } from './settings.service.js';

export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  get = async () => this.svc.get();

  update = async (req: FastifyRequest) => this.svc.update(actorId(req), parse(settingsSchema, req.body));
}
