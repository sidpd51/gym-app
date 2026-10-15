import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parsePageQuery } from '../../common/pagination.js';
import { dateString, parse, uuidParam } from '../../common/validate.js';
import { actorId } from '../../plugins/auth.js';
import type { TrainerService } from './service.js';

const email = z.union([z.literal(''), z.email().max(255)]).nullish();

export const createTrainerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(1).max(20),
  email,
  specialization: z.string().max(100).nullish(),
  joiningDate: dateString,
});

export const updateTrainerSchema = z.object({
  firstName: z.string().min(1).max(50).nullish(),
  lastName: z.string().min(1).max(50).nullish(),
  phone: z.string().max(20).nullish(),
  email,
  specialization: z.string().max(100).nullish(),
  status: z.enum(['ACTIVE', 'INACTIVE']).nullish(),
});

const assignSchema = z.object({ trainerId: z.uuid() });

export function trainerRoutes(svc: TrainerService) {
  return async (app: FastifyInstance) => {
    app.get('/trainers', { onRequest: [app.requirePermission('trainers:view')] }, async (req) => {
      const query = req.query as Record<string, string>;
      return svc.list(parsePageQuery(query), { status: query.status || undefined });
    });
    app.get('/trainers/:id', { onRequest: [app.requirePermission('trainers:view')] }, async (req) =>
      svc.getByID(uuidParam(req, 'id', 'Invalid id.')),
    );
    app.post('/trainers', { onRequest: [app.requirePermission('trainers:create')] }, async (req, reply) => {
      const body = parse(createTrainerSchema, req.body);
      return reply.status(201).send(await svc.create(actorId(req), body));
    });
    app.patch('/trainers/:id', { onRequest: [app.requirePermission('trainers:edit')] }, async (req) => {
      const id = uuidParam(req, 'id', 'Invalid id.');
      return svc.update(actorId(req), id, parse(updateTrainerSchema, req.body));
    });
    app.delete('/trainers/:id', { onRequest: [app.requirePermission('trainers:delete')] }, async (req, reply) => {
      await svc.delete(actorId(req), uuidParam(req, 'id', 'Invalid id.'));
      return reply.status(204).send();
    });

    // Member -> trainer assignment
    app.get('/members/:memberId/trainer', { onRequest: [app.requirePermission('members:view')] }, async (req) =>
      svc.getAssignmentForMember(uuidParam(req, 'memberId', 'Invalid memberId.')),
    );
    app.post('/members/:memberId/trainer', { onRequest: [app.requirePermission('members:edit')] }, async (req, reply) => {
      const memberId = uuidParam(req, 'memberId', 'Invalid memberId.');
      const body = parse(assignSchema, req.body);
      return reply.status(201).send(await svc.assign(actorId(req), memberId, body.trainerId));
    });
    app.delete('/members/:memberId/trainer', { onRequest: [app.requirePermission('members:edit')] }, async (req, reply) => {
      await svc.endAssignment(actorId(req), uuidParam(req, 'memberId', 'Invalid memberId.'));
      return reply.status(204).send();
    });
  };
}
