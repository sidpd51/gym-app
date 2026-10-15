import type { FastifyRequest } from 'fastify';
import { parseRange } from './report.schemas.js';
import type { ReportService } from './report.service.js';

export class ReportController {
  constructor(private readonly svc: ReportService) {}

  /** For v1 every report returns the overview payload (same as the Go service). */
  overview = async (req: FastifyRequest) => this.svc.overview(parseRange(req.query));
}
