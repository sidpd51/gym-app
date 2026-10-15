import type { FastifyBaseLogger } from 'fastify';
import type { Config } from '../config.js';
import type { DbPool } from '../db/pool.js';

/** Dependencies handed to every module factory. */
export interface ModuleContext {
  pool: DbPool;
  config: Config;
  log: FastifyBaseLogger;
}
