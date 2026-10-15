import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { forbidden, unauthenticated } from '../common/errors.js';
import { hasPermission, type Permission, type Role } from '../common/permissions.js';

export const SESSION_COOKIE_NAME = 'gym_session';

export interface Actor {
  userId: string;
  role: Role;
}

export interface SessionClaims {
  sub: string;
  role: Role;
}

export class Signer {
  constructor(
    private readonly secret: string,
    private readonly ttlMs: number,
  ) {}

  get ttlSeconds(): number {
    return Math.floor(this.ttlMs / 1000);
  }

  sign(userId: string, role: Role): string {
    return jwt.sign({ role }, this.secret, {
      algorithm: 'HS256',
      subject: userId,
      issuer: 'gym-backend',
      expiresIn: this.ttlSeconds,
    });
  }

  /** Throws on expired / malformed / wrong-algorithm tokens. */
  verify(raw: string): SessionClaims {
    const c = jwt.verify(raw, this.secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (typeof c.sub !== 'string') throw new Error('missing sub');
    return { sub: c.sub, role: c.role as Role };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    signer: Signer;
    /** onRequest hook: verifies the session cookie and sets request.actor (401 otherwise). */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Returns an onRequest hook that 403s unless request.actor's role grants `perm`. */
    requirePermission: (perm: Permission) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    actor?: Actor;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function registerAuth(app: FastifyInstance, signer: Signer): void {
  app.decorate('signer', signer);
  app.decorateRequest('actor', undefined);

  app.decorate('authenticate', async (req: FastifyRequest) => {
    const raw = req.cookies[SESSION_COOKIE_NAME];
    if (!raw) throw unauthenticated('AUTH_REQUIRED', 'Authentication required.');
    let claims: SessionClaims;
    try {
      claims = signer.verify(raw);
    } catch {
      throw unauthenticated('AUTH_INVALID_SESSION', 'Your session is invalid or has expired.');
    }
    if (!UUID_RE.test(claims.sub)) throw unauthenticated('AUTH_INVALID_SESSION', 'Your session is invalid.');
    req.actor = { userId: claims.sub, role: claims.role };
  });

  app.decorate('requirePermission', (perm: Permission) => async (req: FastifyRequest) => {
    if (!req.actor) throw unauthenticated('AUTH_REQUIRED', 'Authentication required.');
    if (!hasPermission(req.actor.role, perm)) {
      throw forbidden('FORBIDDEN', 'You do not have permission to perform this action.');
    }
  });
}

/** The authenticated user's id; throws 401 if called on an unauthenticated route. */
export function actorId(req: FastifyRequest): string {
  if (!req.actor) throw unauthenticated('AUTH_REQUIRED', 'Authentication required.');
  return req.actor.userId;
}
