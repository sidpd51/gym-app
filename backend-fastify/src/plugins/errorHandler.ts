import type { FastifyError, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError, badRequest, internalError } from '../common/errors.js';

/** Maps zod issues to the { field, rule, param } shape the Go validator produced. */
function zodFields(err: ZodError) {
  return err.issues.map((i) => ({
    field: i.path.join('.') || '(root)',
    rule: i.code,
    param: 'maximum' in i ? String(i.maximum) : 'minimum' in i ? String(i.minimum) : '',
  }));
}

export function registerErrorHandling(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError | AppError | ZodError, req, reply) => {
    if (err instanceof AppError) {
      if (err.status >= 500) req.log.error({ err, cause: err.cause }, 'app error');
      return reply.status(err.status).send(err.toJSON());
    }
    if (err instanceof ZodError) {
      const e = badRequest('VALIDATION_FAILED', 'Request validation failed.').withDetails({ fields: zodFields(err) });
      return reply.status(400).send(e.toJSON());
    }
    const fe = err as FastifyError;
    if (fe.code === 'FST_ERR_CTP_INVALID_JSON_BODY' || fe.code === 'FST_ERR_CTP_INVALID_CONTENT_LENGTH' || fe.code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
      return reply.status(400).send(badRequest('INVALID_JSON', 'Request body is not valid JSON.').toJSON());
    }
    if (fe.statusCode === 429) {
      return reply.status(429).send({ code: 'RATE_LIMITED', status: 429, message: 'Too many requests. Please try again later.' });
    }
    if (fe.statusCode && fe.statusCode < 500) {
      return reply.status(fe.statusCode).send({ code: fe.code ?? 'BAD_REQUEST', status: fe.statusCode, message: fe.message });
    }
    req.log.error({ err }, 'unhandled error');
    return reply.status(500).send(internalError().toJSON());
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ code: 'NOT_FOUND', status: 404, message: 'Route not found.' });
  });
}
