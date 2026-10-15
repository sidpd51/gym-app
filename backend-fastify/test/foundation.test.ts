import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDb, type TestDb } from './helpers/testdb.js';
import { loggedIn, setup, TestClient, createUser } from './helpers/client.js';

let db: TestDb;
let env: Awaited<ReturnType<typeof setup>>;

beforeAll(async () => {
  db = await startTestDb();
  env = await setup(db.url);
}, 120_000);
afterAll(async () => {
  await env?.close();
  await db?.stop();
});

describe('auth + csrf + users + members', () => {
  it('health', async () => {
    const r = await env.app.inject('/health');
    expect(r.statusCode).toBe(200);
    expect(r.json().status).toEqual({ server: 'ok', db: 'ok' });
  });

  it('rejects unauthenticated access', async () => {
    const c = new TestClient(env.app);
    const r = await c.get('/members');
    expect(r.status).toBe(401);
    expect(r.body.code).toBe('AUTH_REQUIRED');
  });

  it('login failures use the generic credential error', async () => {
    const u = await createUser(env.pool, 'a@t.dev', 'ADMIN');
    const c = new TestClient(env.app);
    expect((await c.login('nobody@t.dev', 'whatever123')).body.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect((await c.login(u.email, 'wrongpass123')).body.code).toBe('AUTH_INVALID_CREDENTIALS');
    const bad = await c.login('not-an-email', 'x');
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('VALIDATION_FAILED');
  });

  it('login, me, csrf enforcement, logout', async () => {
    const { client, user } = await loggedIn(env.app, env.pool, 'OWNER');
    const me = await client.get('/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(user.email);
    expect(me.body.passwordHash).toBeUndefined();

    // Unsafe request without CSRF header -> 403
    const raw = await env.app.inject({
      method: 'POST', url: '/api/v1/members',
      headers: { cookie: (client as any).cookieHeader() },
      payload: {},
    });
    expect(raw.statusCode).toBe(403);

    expect((await client.post('/auth/logout')).status).toBe(204);
    expect((await client.get('/auth/me')).status).toBe(401);
  });

  it('permissions are enforced per role', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'TRAINER');
    expect((await client.get('/members')).status).toBe(200);
    const r = await client.post('/members', {});
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('FORBIDDEN');
  });

  it('member CRUD with audit trail', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const bad = await client.post('/members', { firstName: 'A', lastName: 'B', phone: '123', joiningDate: '2024-01-01' });
    expect(bad.status).toBe(400);

    const created = await client.post('/members', {
      firstName: 'Asha', lastName: 'Rao', phone: '9876543210', joiningDate: '2024-01-15', email: 'asha@x.dev',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      memberCode: expect.stringMatching(/^MEM-\d{3}$/), status: 'ACTIVE', joiningDate: '2024-01-15', dateOfBirth: null,
    });

    const dup = await client.post('/members', { firstName: 'X', lastName: 'Y', phone: '9876543210', joiningDate: '2024-01-15' });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('MEMBER_PHONE_DUPLICATE');

    const id = created.body.id;
    const upd = await client.patch(`/members/${id}`, { firstName: 'Asha2', status: 'SUSPENDED' });
    expect(upd.body).toMatchObject({ firstName: 'Asha2', status: 'SUSPENDED', lastName: 'Rao' });

    const list = await client.get('/members?search=asha2&pageSize=5');
    expect(list.body.meta).toMatchObject({ page: 1, pageSize: 5, total: 1, totalPages: 1 });

    expect((await client.get('/members/not-a-uuid')).body.code).toBe('INVALID_UUID');
    expect((await client.delete(`/members/${id}`)).status).toBe(204);
    expect((await client.get(`/members/${id}`)).status).toBe(404);

    const audit = await env.pool.query("SELECT action FROM audit_logs WHERE entity_type='MEMBER' ORDER BY timestamp");
    expect(audit.rows.map((r) => r.action)).toEqual(['CREATE', 'UPDATE', 'DELETE']);
  });

  it('user management + profile password change', async () => {
    const { client, user } = await loggedIn(env.app, env.pool, 'OWNER');
    const created = await client.post('/users', {
      firstName: 'New', lastName: 'Staff', email: 'New@T.dev', role: 'RECEPTIONIST', password: 'longenough1',
    });
    expect(created.status).toBe(201);
    expect(created.body.email).toBe('new@t.dev');
    expect((await client.delete(`/users/${user.id}`)).body.code).toBe('USER_SELF_DELETE_FORBIDDEN');

    const staff = new TestClient(env.app);
    expect((await staff.login('new@t.dev', 'longenough1')).status).toBe(200);
    const bad = await staff.patch('/auth/profile', { newPassword: 'anotherpass1', currentPassword: 'nope-nope' });
    expect(bad.body.code).toBe('PROFILE_CURRENT_PASSWORD_INVALID');
    const ok = await staff.patch('/auth/profile', { newPassword: 'anotherpass1', currentPassword: 'longenough1', firstName: 'Renamed' });
    expect(ok.body.firstName).toBe('Renamed');
    expect((await new TestClient(env.app).login('new@t.dev', 'anotherpass1')).status).toBe(200);
  });
});
