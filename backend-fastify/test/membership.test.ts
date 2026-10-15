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

describe('memberships', () => {
  it('create computes end date, snapshots plan, blocks duplicates and inactive plans', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const plan = (await client.post('/membership-plans', { name: 'Monthly', durationInDays: 30, price: 1500 })).body;
    const inactive = (await client.post('/membership-plans', { name: 'Old', durationInDays: 30, price: 1, status: 'INACTIVE' })).body;
    const m = (await client.post('/members', { firstName: 'M', lastName: 'M', phone: '9000000002', joiningDate: '2024-01-01' })).body;

    expect((await client.post('/memberships', { memberId: m.id, planId: plan.id })).body.code).toBe('VALIDATION_FAILED');
    expect((await client.post('/memberships', { memberId: m.id, planId: plan.id, startDate: '2024-02-31' })).status).toBe(400);
    expect((await client.post('/memberships', { memberId: m.id, planId: '00000000-0000-4000-8000-000000000000', startDate: '2024-01-01' })).body.code).toBe('PLAN_NOT_FOUND');
    const inact = await client.post('/memberships', { memberId: m.id, planId: inactive.id, startDate: '2024-01-01' });
    expect(inact.status).toBe(422);
    expect(inact.body.code).toBe('PLAN_INACTIVE');

    const ok = await client.post('/memberships', { memberId: m.id, planId: plan.id, startDate: '2024-01-01' });
    expect(ok.status).toBe(201);
    expect(ok.body).toMatchObject({ planName: 'Monthly', startDate: '2024-01-01', endDate: '2024-01-30', amount: '1500', status: 'ACTIVE' });

    const dup = await client.post('/memberships', { memberId: m.id, planId: plan.id, startDate: '2024-03-01' });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('MEMBERSHIP_ALREADY_ACTIVE');

    const bad = await client.post('/memberships', { memberId: '00000000-0000-4000-8000-000000000000', planId: plan.id, startDate: '2024-01-01' });
    expect(bad.body.code).toBe('INVALID_REFERENCE');

    expect((await client.get(`/memberships/${ok.body.id}`)).body.id).toBe(ok.body.id);
    expect((await client.get('/memberships/00000000-0000-4000-8000-000000000000')).body.code).toBe('MEMBERSHIP_NOT_FOUND');
    const list = await client.get(`/memberships?memberId=${m.id}&status=ACTIVE`);
    expect(list.body.meta.total).toBe(1);
    expect((await client.get('/memberships?memberId=nope')).body.code).toBe('INVALID_UUID');

    const audit = await env.pool.query("SELECT 1 FROM audit_logs WHERE entity_type='MEMBERSHIP'");
    expect(audit.rowCount).toBe(1);
  });

  it('trainer can view but not create', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'TRAINER');
    expect((await client.get('/memberships')).status).toBe(200);
    expect((await client.post('/memberships', {})).status).toBe(403);
  });
});
