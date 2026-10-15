import type { FastifyRequest } from 'fastify';
import { uuidParam } from '../../common/validate.js';
import { parseAuditQuery } from './audit.schemas.js';
import type { AuditService } from './audit.service.js';

export class AuditController {
  constructor(private readonly svc: AuditService) {}

  list = async (req: FastifyRequest) => {
    const { page, filter } = parseAuditQuery(req.query as Record<string, string>);
    return this.svc.list(page, filter);
  };

  get = async (req: FastifyRequest) => this.svc.get(uuidParam(req, 'id', 'Invalid id.'));
}
