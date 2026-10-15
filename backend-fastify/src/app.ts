import { readFileSync } from 'node:fs';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import type { DbPool } from './db/pool.js';
import { Signer, registerAuth } from './plugins/auth.js';
import { registerCsrf } from './plugins/csrf.js';
import { registerErrorHandling } from './plugins/errorHandler.js';
import { authProtectedRoutes, authPublicRoutes } from './modules/auth/routes.js';
import type { ModuleContext } from './modules/context.js';
import { featureModules } from './modules/index.js';
import { userRoutes } from './modules/user/routes.js';
import { UserService } from './modules/user/service.js';

const startTime = Date.now();

export async function buildApp(config: Config, pool: DbPool): Promise<FastifyInstance> {
  const https = config.httpsCert && config.httpsKey
    ? { cert: readFileSync(config.httpsCert), key: readFileSync(config.httpsKey) }
    : null;

  const app = Fastify({
    logger: { level: config.logLevel },
    disableRequestLogging: true,
    trustProxy: true,
    ...(https ? { https } : {}),
  }) as unknown as FastifyInstance;
  const cookieSecure = https !== null;

  // Empty body with Content-Type: application/json (e.g. bodyless DELETE) is not an error.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (body === '' || body === undefined) return done(null, undefined);
    try {
      done(null, JSON.parse(body as string));
    } catch (err) {
      const e = err as Error & { statusCode?: number; code?: string };
      e.statusCode = 400;
      e.code = 'FST_ERR_CTP_INVALID_JSON_BODY';
      done(e, undefined);
    }
  });

  app.addHook('onResponse', async (req, reply) => {
    const path = req.url.split('?')[0];
    app.log[path === '/health' ? 'debug' : 'info'](
      { method: req.method, path, status: reply.statusCode, duration: Math.round(reply.elapsedTime), remoteIp: req.ip },
      'http_request',
    );
  });

  registerErrorHandling(app);
  await app.register(cors, {
    origin: [config.frontendOrigin],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Content-Type', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    credentials: true,
    maxAge: 300,
  });
  await app.register(cookie);
  await app.register(rateLimit, { global: false });

  const signer = new Signer(config.jwtSecret, config.sessionTtlMs);
  registerAuth(app, signer);
  registerCsrf(app, { secret: config.cookieSecret, trustedOrigin: config.frontendOrigin, secure: cookieSecure });

  app.get('/health', async (_req, reply) => {
    let db = 'ok';
    try {
      await Promise.race([
        pool.query('SELECT 1'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000).unref()),
      ]);
    } catch {
      db = 'unreachable';
      reply.status(500);
    }
    return { status: { server: 'ok', db }, uptime: (Date.now() - startTime) / 1000 };
  });

  const userSvc = new UserService(pool);
  const ctx: ModuleContext = { pool, config, log: app.log };

  await app.register(
    async (api) => {
      // Login/logout live outside CSRF: no session on login, logout only clears a cookie.
      await api.register(authPublicRoutes(userSvc, cookieSecure, config.loginRateLimitMax));

      await api.register(async (guarded) => {
        guarded.addHook('onRequest', guarded.csrfProtect);
        await guarded.register(authProtectedRoutes(userSvc));

        await guarded.register(async (authed) => {
          authed.addHook('onRequest', authed.authenticate);
          await authed.register(userRoutes(userSvc));
          for (const mod of featureModules) await authed.register(mod(ctx));
        });
      });
    },
    { prefix: '/api/v1' },
  );

  return app;
}
