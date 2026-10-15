import type { FastifyRequest } from 'fastify';
import { unauthenticated } from '../../common/errors.js';
import type { SearchService } from './search.service.js';

export class SearchController {
  constructor(private readonly svc: SearchService) {}

  search = async (req: FastifyRequest) => {
    if (!req.actor) throw unauthenticated('AUTH_REQUIRED', 'Authentication required.');
    const q = (req.query as Record<string, string>).q ?? '';
    return this.svc.search(q, req.actor.role);
  };
}
