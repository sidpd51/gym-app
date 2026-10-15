import type { FastifyReply, FastifyRequest } from 'fastify';
import { parse } from '../../common/validate.js';
import { actorId, SESSION_COOKIE_NAME } from '../../plugins/auth.js';
import { updateProfileSchema } from '../user/user.schemas.js';
import { loginSchema } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

/** HTTP adapter for auth: cookie handling, CSRF token, request parsing. */
export class AuthController {
  private readonly cookieOpts: { path: string; httpOnly: boolean; secure: boolean; sameSite: 'strict' };

  constructor(
    private readonly svc: AuthService,
    cookieSecure: boolean,
  ) {
    this.cookieOpts = { path: '/', httpOnly: true, secure: cookieSecure, sameSite: 'strict' };
  }

  login = async (req: FastifyRequest, reply: FastifyReply) => {
    const { token, user } = await this.svc.login(parse(loginSchema, req.body));
    reply.setCookie(SESSION_COOKIE_NAME, token, { ...this.cookieOpts, maxAge: this.svc.sessionTtlSeconds });
    return user;
  };

  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    await this.svc.logout(req.cookies[SESSION_COOKIE_NAME]);
    reply.clearCookie(SESSION_COOKIE_NAME, this.cookieOpts);
    return reply.status(204).send();
  };

  csrfToken = async (req: FastifyRequest, reply: FastifyReply) => ({ token: req.server.csrfToken(req, reply) });

  me = async (req: FastifyRequest) => this.svc.me(actorId(req));

  updateProfile = async (req: FastifyRequest) => this.svc.updateProfile(actorId(req), parse(updateProfileSchema, req.body));
}
