import type { FastifyInstance } from 'fastify';
import type { AuthController } from './auth.controller.js';

/** Public auth routes — registered OUTSIDE csrf/auth hooks (no session yet on login; logout only clears a cookie). */
export function authPublicRoutes(c: AuthController, loginRateLimitMax: number) {
  return async (app: FastifyInstance) => {
    app.post('/auth/login', { config: { rateLimit: { max: loginRateLimitMax, timeWindow: '1 minute' } } }, c.login);
    app.post('/auth/logout', c.logout);
  };
}

/** CSRF-protected auth routes. /csrf-token needs no session. */
export function authProtectedRoutes(c: AuthController) {
  return async (app: FastifyInstance) => {
    app.get('/csrf-token', c.csrfToken);
    app.get('/auth/me', { onRequest: [app.authenticate] }, c.me);
    app.patch('/auth/profile', { onRequest: [app.authenticate] }, c.updateProfile);
  };
}
