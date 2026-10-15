import type { FastifyPluginAsync } from 'fastify';
import type { DbPool } from '../../db/pool.js';
import type { Signer } from '../../plugins/auth.js';
import type { UserService } from '../user/user.service.js';
import { AuthController } from './auth.controller.js';
import { authProtectedRoutes, authPublicRoutes } from './auth.routes.js';
import { AuthService } from './auth.service.js';

/** Composition root for auth. `publicRoutes` must be mounted outside CSRF; `protectedRoutes` inside it. */
export function createAuthModule(opts: {
  pool: DbPool;
  users: UserService;
  signer: Signer;
  cookieSecure: boolean;
  loginRateLimitMax: number;
}): { publicRoutes: FastifyPluginAsync; protectedRoutes: FastifyPluginAsync } {
  const service = new AuthService(opts.pool, opts.users, opts.signer);
  const controller = new AuthController(service, opts.cookieSecure);
  return {
    publicRoutes: authPublicRoutes(controller, opts.loginRateLimitMax),
    protectedRoutes: authProtectedRoutes(controller),
  };
}
