import type { FastifyInstance } from 'fastify';
import type { SearchController } from './search.controller.js';

/** Any authenticated user may search; results are filtered by role permissions in the service. */
export function searchRoutes(c: SearchController) {
  return async (app: FastifyInstance) => {
    app.get('/search', c.search);
  };
}
