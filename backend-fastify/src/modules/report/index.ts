import type { FastifyPluginAsync } from 'fastify';
import type { ModuleContext } from '../context.js';

// STUB — to be replaced by the real port.
export function reportModule(_ctx: ModuleContext): FastifyPluginAsync {
  return async () => {};
}
