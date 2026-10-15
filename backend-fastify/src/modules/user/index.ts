import type { FastifyPluginAsync } from 'fastify';
import type { DbPool } from '../../db/pool.js';
import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { userRoutes } from './user.routes.js';
import { UserService } from './user.service.js';

/**
 * Composition root for users. The service is exposed because the auth module
 * depends on it (login, profile); routes are mounted behind session auth.
 */
export function createUserModule(pool: DbPool): { service: UserService; routes: FastifyPluginAsync } {
  const repo = new UserRepository(pool);
  const service = new UserService(pool, repo);
  return { service, routes: userRoutes(new UserController(service)) };
}
