import type { FastifyInstance, FastifyReply } from 'fastify';
import { z } from 'zod';
import { auditLog } from '../../common/audit.js';
import { forbidden, unauthenticated } from '../../common/errors.js';
import { parse } from '../../common/validate.js';
import { actorId, SESSION_COOKIE_NAME } from '../../plugins/auth.js';
import { updateProfileSchema } from '../user/routes.js';
import { toUserResponse, type UserService } from '../user/service.js';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

/** Public auth routes — registered OUTSIDE csrf/auth hooks (no session yet on login; logout only clears a cookie). */
export function authPublicRoutes(svc: UserService, cookieSecure: boolean, loginRateLimitMax: number) {
  return async (app: FastifyInstance) => {
    const cookieOpts = { path: '/', httpOnly: true, secure: cookieSecure, sameSite: 'strict' as const };

    app.post('/auth/login', { config: { rateLimit: { max: loginRateLimitMax, timeWindow: '1 minute' } } }, async (req, reply) => {
      const body = parse(loginSchema, req.body);
      const u = await svc.getByEmail(body.email.toLowerCase());
      if (!u) {
        // No user to attribute an audit row to (user_id is NOT NULL FK); same generic error as wrong password.
        throw unauthenticated('AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }
      const name = `${u.first_name} ${u.last_name}`;
      const failed = (description: string) =>
        auditLog(svc.pool, {
          userId: u.id, action: 'LOGIN', entityType: 'USER', entityId: u.id, entityName: name,
          description, status: 'FAILED',
        }).catch(() => undefined);

      if (!(await svc.verifyPassword(u.password_hash, body.password))) {
        await failed('Failed login: wrong password');
        throw unauthenticated('AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.');
      }
      if (u.status !== 'ACTIVE') {
        await failed('Failed login: inactive account');
        throw forbidden('AUTH_ACCOUNT_INACTIVE', 'Your account has been deactivated.');
      }

      const token = app.signer.sign(u.id, u.role);
      await svc.markLoggedIn(u.id);
      await auditLog(svc.pool, {
        userId: u.id, action: 'LOGIN', entityType: 'USER', entityId: u.id, entityName: name, description: 'User logged in',
      }).catch(() => undefined);

      reply.setCookie(SESSION_COOKIE_NAME, token, { ...cookieOpts, maxAge: app.signer.ttlSeconds });
      return toUserResponse(u);
    });

    app.post('/auth/logout', async (req, reply: FastifyReply) => {
      const raw = req.cookies[SESSION_COOKIE_NAME];
      if (raw) {
        try {
          const claims = app.signer.verify(raw);
          await auditLog(svc.pool, {
            userId: claims.sub, action: 'LOGOUT', entityType: 'USER', entityId: claims.sub, description: 'User logged out',
          });
        } catch {
          /* invalid/expired token or audit failure: still clear the cookie */
        }
      }
      reply.clearCookie(SESSION_COOKIE_NAME, cookieOpts);
      return reply.status(204).send();
    });
  };
}

/** CSRF-protected auth routes. /csrf-token needs no session. */
export function authProtectedRoutes(svc: UserService) {
  return async (app: FastifyInstance) => {
    app.get('/csrf-token', async (req, reply) => ({ token: app.csrfToken(req, reply) }));

    app.get('/auth/me', { onRequest: [app.authenticate] }, async (req) => svc.getByID(actorId(req)));

    app.patch('/auth/profile', { onRequest: [app.authenticate] }, async (req) =>
      svc.updateProfile(actorId(req), parse(updateProfileSchema, req.body)),
    );
  };
}
