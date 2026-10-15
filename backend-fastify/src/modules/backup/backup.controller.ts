import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Readable } from 'node:stream';
import { AppError, badRequest, internalError } from '../../common/errors.js';
import { actorId } from '../../plugins/auth.js';
import type { BackupService } from './backup.service.js';

export class BackupController {
  constructor(private readonly svc: BackupService) {}

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const bf = await this.svc.create(false);
      return reply.status(201).send({ ...bf, triggeredBy: actorId(req) });
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('BACKUP_FAILED', 500, internalError().message, undefined, err);
    }
  };

  list = async () => this.svc.list();

  restore = async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.headers['content-length'] === '0' || !req.body) {
      throw badRequest('EMPTY_BODY', 'Upload a .sql dump as the request body.');
    }
    try {
      await this.svc.restore(req.body as Readable);
    } catch (err) {
      throw new AppError('RESTORE_FAILED', 500, internalError().message, undefined, err);
    }
    // Graceful restart so the service manager gives us a fresh connection pool.
    setTimeout(() => this.svc.restartHook(), 100).unref();
    return reply.status(202).type('application/json').send('{"status":"restored","restarting":true}');
  };
}
