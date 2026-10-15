import type { FastifyPluginAsync } from 'fastify';
import { badRequest, unauthenticated } from '../../common/errors.js';
import { hasPermission } from '../../common/permissions.js';
import { queryMany } from '../../db/pool.js';
import type { ModuleContext } from '../context.js';

const MIN_QUERY_LEN = 2;

export function searchModule(ctx: ModuleContext): FastifyPluginAsync {
  return async (app) => {
    app.get('/search', async (req) => {
      const q = (req.query as Record<string, string>).q ?? '';
      // Go compares byte length.
      if (Buffer.byteLength(q) < MIN_QUERY_LEN) {
        throw badRequest('QUERY_TOO_SHORT', 'Search query must be at least 2 characters.');
      }
      if (!req.actor) throw unauthenticated('AUTH_REQUIRED', 'Authentication required.');
      const role = req.actor.role;
      const none = Promise.resolve([] as any[]);

      const [members, trainers, leads] = await Promise.all([
        hasPermission(role, 'members:view')
          ? queryMany(ctx.pool,
              `SELECT id, member_code, first_name, last_name, phone FROM members
               WHERE first_name ILIKE '%' || $1 || '%' OR last_name ILIKE '%' || $1 || '%'
                  OR phone ILIKE '%' || $1 || '%' OR member_code ILIKE '%' || $1 || '%' LIMIT 5`, [q])
          : none,
        hasPermission(role, 'trainers:view')
          ? queryMany(ctx.pool,
              `SELECT id, trainer_code, first_name, last_name, phone FROM trainers
               WHERE first_name ILIKE '%' || $1 || '%' OR last_name ILIKE '%' || $1 || '%'
                  OR phone ILIKE '%' || $1 || '%' OR trainer_code ILIKE '%' || $1 || '%' LIMIT 5`, [q])
          : none,
        hasPermission(role, 'leads:view')
          ? queryMany(ctx.pool,
              `SELECT id, lead_code, name, phone FROM leads
               WHERE name ILIKE '%' || $1 || '%' OR phone ILIKE '%' || $1 || '%' OR lead_code ILIKE '%' || $1 || '%' LIMIT 5`, [q])
          : none,
      ]);

      return {
        members: members.map((r) => ({ id: r.id, memberCode: r.member_code, name: `${r.first_name} ${r.last_name}`, phone: r.phone })),
        trainers: trainers.map((r) => ({ id: r.id, trainerCode: r.trainer_code, name: `${r.first_name} ${r.last_name}`, phone: r.phone })),
        leads: leads.map((r) => ({ id: r.id, leadCode: r.lead_code, name: r.name, phone: r.phone })),
      };
    });
  };
}
