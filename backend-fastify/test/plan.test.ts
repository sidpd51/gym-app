import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDb, type TestDb } from './helpers/testdb.js';
import { loggedIn, setup } from './helpers/client.js';

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

describe('membership plans', () => {
  it('CRUD, validation, permissions, audit', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    expect((await client.post('/membership-plans', { name: '', durationInDays: 30, price: 10 })).body.code).toBe('VALIDATION_FAILED');
    expect((await client.post('/membership-plans', { name: 'Z', durationInDays: 0, price: 10 })).status).toBe(400);
    expect((await client.post('/membership-plans', { name: 'Z', durationInDays: 30, price: 0 })).body.code).toBe('INVALID_PRICE');

    const c = await client.post('/membership-plans', { name: 'Monthly', durationInDays: 30, price: 1500.5, description: 'd' });
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({ name: 'Monthly', price: '1500.5', status: 'ACTIVE', durationInDays: 30, description: 'd' });
    const whole = await client.post('/membership-plans', { name: 'Annual', durationInDays: 365, price: '12000.00' });
    expect(whole.body.price).toBe('12000');

    const id = c.body.id;
    const u = await client.patch(`/membership-plans/${id}`, { status: 'INACTIVE', price: 1600 });
    expect(u.body).toMatchObject({ status: 'INACTIVE', price: '1600', name: 'Monthly' });
    expect((await client.patch(`/membership-plans/${id}`, { price: -1 })).body.code).toBe('INVALID_PRICE');
    expect((await client.patch('/membership-plans/00000000-0000-4000-8000-000000000000', {})).body.code).toBe('PLAN_NOT_FOUND');

    const list = await client.get('/membership-plans?status=INACTIVE');
    expect(list.body.meta.total).toBe(1);
    expect((await client.get('/membership-plans/xyz')).body.code).toBe('INVALID_UUID');

    expect((await client.delete(`/membership-plans/${id}`)).status).toBe(204);
    expect((await client.get(`/membership-plans/${id}`)).status).toBe(404);
    const audit = await env.pool.query("SELECT action FROM audit_logs WHERE entity_type='MEMBERSHIP_PLAN' ORDER BY timestamp");
    expect(audit.rows.map((r) => r.action)).toEqual(['CREATE', 'CREATE', 'UPDATE', 'DELETE']);
  });

  it('denies receptionist create, allows view', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await client.get('/membership-plans')).status).toBe(200);
    expect((await client.post('/membership-plans', { name: 'X', durationInDays: 1, price: 1 })).status).toBe(403);
  });

  it('refuses to delete a referenced plan', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const plan = (await client.post('/membership-plans', { name: 'Ref', durationInDays: 10, price: 100 })).body;
    const m = (await client.post('/members', { firstName: 'R', lastName: 'F', phone: '9000000001', joiningDate: '2024-01-01' })).body;
    expect((await client.post('/memberships', { memberId: m.id, planId: plan.id, startDate: '2024-01-01' })).status).toBe(201);
    const del = await client.delete(`/membership-plans/${plan.id}`);
    expect(del.status).toBe(409);
    expect(del.body.code).toBe('PLAN_REFERENCED');
  });
});
