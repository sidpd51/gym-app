import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePageQuery } from '../../common/pagination.js';
import { parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { UserService } from './service.js';

const role = z.enum(['OWNER', 'ADMIN', 'RECEPTIONIST', 'TRAINER']);

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.email().max(255),
  phone: z.string().max(20).nullish().transform((v) => v ?? undefined),
  role,
  password: z.string().min(8).max(72),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).nullish(),
  lastName: z.string().min(1).max(50).nullish(),
  phone: z.string().max(20).nullish(),
  role: role.nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(50).nullish(),
    lastName: z.string().min(1).max(50).nullish(),
    phone: z.string().max(20).nullish(),
    currentPassword: z.string().min(1).nullish(),
    newPassword: z.string().min(8).max(72).nullish(),
  })
  .refine((v) => !v.newPassword || !!v.currentPassword, {
    path: ['newPassword'],
    message: 'currentPassword is required with newPassword',
  });

export function userRoutes(svc: UserService) {
  return async (app: FastifyInstance) => {
    app.get('/users', { onRequest: [app.requirePermission('users:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      return svc.list(parsePageQuery(query), { role: query.role, status: query.status });
    });

    app.get('/users/:id', { onRequest: [app.requirePermission('users:view')] }, async (req) =>
      svc.getByID(uuidParam(req, 'id', 'Invalid user id.')),
    );

    app.post('/users', { onRequest: [app.requirePermission('users:create')] }, async (req, reply) => {
      const body = parse(createUserSchema, req.body);
      return reply.status(201).send(await svc.create(actorId(req), body));
    });

    app.patch('/users/:id', { onRequest: [app.requirePermission('users:edit')] }, async (req) => {
      const id = uuidParam(req, 'id', 'Invalid user id.');
      return svc.update(actorId(req), id, parse(updateUserSchema, req.body));
    });

    app.delete('/users/:id', { onRequest: [app.requirePermission('users:delete')] }, async (req, reply) => {
      await svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid user id.'));
      return reply.status(204).send();
    });
  };
}
