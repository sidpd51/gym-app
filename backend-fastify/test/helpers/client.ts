import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import type { Config } from '../../src/config.js';
import { buildApp } from '../../src/app.js';
import { createPool, type DbPool } from '../../src/db/pool.js';
import { nextCode } from '../../src/common/codegen.js';

export function testConfig(databaseUrl: string): Config {
  return {
    env: 'test', port: 0, databaseUrl,
    jwtSecret: 'test-jwt-secret-test-jwt-secret-test-jwt-secret',
    cookieSecret: 'test-cookie-secret-test-cookie-secret-0123',
    frontendOrigin: 'http://localhost:5173', sessionTtlMs: 8 * 3600_000,
    backupDir: '/tmp/gym-test-backups', logLevel: 'silent', loginRateLimitMax: 1000,
    backupUseDockerExec: false, backupDockerContainer: 'gym-postgres',
  };
}

export async function createUser(pool: DbPool, email: string, role: string, password = 'Passw0rd!x') {
  const hash = await bcrypt.hash(password, 4);
  const code = await nextCode(pool, 'user');
  const res = await pool.query(
    `INSERT INTO users (user_code, first_name, last_name, email, role, status, password_hash)
     VALUES ($1,'Test','User',$2,$3,'ACTIVE',$4) RETURNING id`,
    [code, email, role, hash],
  );
  return { id: res.rows[0].id as string, email, password };
}

/** HTTP-level test client that keeps cookies and handles CSRF like the browser frontend does. */
export class TestClient {
  private cookies = new Map<string, string>();
  private csrf?: string;
  constructor(readonly app: FastifyInstance) {}

  private cookieHeader() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async request(method: string, url: string, body?: unknown) {
    const headers: Record<string, string> = { cookie: this.cookieHeader() };
    const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (unsafe && !/\/auth\/(login|logout)$/.test(url)) {
      if (!this.csrf) {
        const r = await this.app.inject({ method: 'GET', url: '/api/v1/csrf-token', headers: { cookie: this.cookieHeader() } });
        this.absorb(r.cookies);
        this.csrf = r.json().token;
      }
      headers['x-csrf-token'] = this.csrf!;
      headers.cookie = this.cookieHeader();
    }
    const res = await this.app.inject({ method: method as any, url: `/api/v1${url}`, headers, payload: body as any });
    this.absorb(res.cookies);
    return { status: res.statusCode, body: res.body ? safeJson(res.body) : undefined, headers: res.headers };
  }
  get = (u: string) => this.request('GET', u);
  post = (u: string, b?: unknown) => this.request('POST', u, b);
  patch = (u: string, b?: unknown) => this.request('PATCH', u, b);
  put = (u: string, b?: unknown) => this.request('PUT', u, b);
  delete = (u: string) => this.request('DELETE', u);

  private absorb(cs: Array<{ name: string; value: string; maxAge?: number }>) {
    for (const c of cs) {
      if (c.value === '' || c.maxAge === 0) this.cookies.delete(c.name);
      else this.cookies.set(c.name, c.value);
    }
  }

  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}

export async function setup(databaseUrl: string) {
  const config = testConfig(databaseUrl);
  const pool = await createPool(databaseUrl);
  const app = await buildApp(config, pool);
  await app.ready();
  return { app, pool, config, close: async () => { await app.close(); await pool.end(); } };
}

/** Creates a user with `role` and returns a logged-in client. */
export async function loggedIn(app: FastifyInstance, pool: DbPool, role = 'OWNER', email = `${role.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}@t.dev`) {
  const u = await createUser(pool, email, role);
  const c = new TestClient(app);
  const r = await c.login(u.email, u.password);
  if (r.status !== 200) throw new Error(`login failed: ${JSON.stringify(r.body)}`);
  return { client: c, user: u };
}
