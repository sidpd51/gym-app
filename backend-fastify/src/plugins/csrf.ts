import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { forbidden } from '../common/errors.js';

export const CSRF_COOKIE_NAME = 'gym_csrf';
const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

declare module 'fastify' {
  interface FastifyInstance {
    /** onRequest hook enforcing CSRF on unsafe methods (login/logout are registered outside it). */
    csrfProtect: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Returns the CSRF token for this client, setting the gym_csrf cookie when absent. */
    csrfToken: (req: FastifyRequest, reply: FastifyReply) => string;
  }
}

/**
 * Signed double-submit CSRF protection, wire-compatible with the previous
 * gorilla/csrf contract the frontend uses: HttpOnly cookie `gym_csrf`, token
 * from GET /csrf-token echoed in the `X-CSRF-Token` header on unsafe methods.
 * token = HMAC(key, cookieValue), so a token can't be forged without the key.
 */
export function registerCsrf(
  app: FastifyInstance,
  opts: { secret: string; trustedOrigin: string; secure: boolean },
): void {
  const key = Buffer.from(opts.secret.padEnd(32, '\0').slice(0, 32));
  const trustedHost = (() => {
    try {
      return new URL(opts.trustedOrigin).host;
    } catch {
      return opts.trustedOrigin;
    }
  })();

  const tokenFor = (cookie: string) => createHmac('sha256', key).update(cookie).digest('base64url');

  const safeEq = (a: string, b: string) => {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  };

  app.decorate('csrfToken', (req: FastifyRequest, reply: FastifyReply) => {
    let cookie = req.cookies[CSRF_COOKIE_NAME];
    if (!cookie) {
      cookie = randomBytes(32).toString('base64url');
      reply.setCookie(CSRF_COOKIE_NAME, cookie, {
        path: '/',
        httpOnly: true,
        secure: opts.secure,
        sameSite: 'strict',
      });
    }
    return tokenFor(cookie);
  });

  app.decorate('csrfProtect', async (req: FastifyRequest) => {
    if (!UNSAFE.has(req.method)) return;

    const origin = req.headers.origin;
    if (origin) {
      let originHost = '';
      try {
        originHost = new URL(origin).host;
      } catch {
        /* falls through to rejection */
      }
      if (originHost !== req.headers.host && originHost !== trustedHost) {
        throw forbidden('CSRF_ORIGIN_INVALID', 'Forbidden - origin not allowed.');
      }
    }

    const cookie = req.cookies[CSRF_COOKIE_NAME];
    const header = req.headers['x-csrf-token'];
    if (!cookie || typeof header !== 'string' || !safeEq(header, tokenFor(cookie))) {
      throw forbidden('CSRF_TOKEN_INVALID', 'Forbidden - CSRF token invalid.');
    }
  });
}
