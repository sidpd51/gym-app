import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { todayIST } from '../src/common/time.js';
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

describe('attendance', () => {
  it('enforces membership policy, uniqueness per day, and lists', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const m = (await client.post('/members', { firstName: 'A', lastName: 'T', phone: '9000000004', joiningDate: '2024-01-01' })).body;

    expect((await client.post('/attendance', {})).body.code).toBe('VALIDATION_FAILED');

    // no active membership, policy off (default)
    const denied = await client.post('/attendance', { memberId: m.id });
    expect(denied.status).toBe(422);
    expect(denied.body.code).toBe('ATTENDANCE_NOT_ALLOWED');

    // policy on -> allowed without membership
    await env.pool.query('UPDATE gym_settings SET allow_attendance_for_expired_membership = true WHERE id = 1');
    const ok = await client.post('/attendance', { memberId: m.id });
    expect(ok.status).toBe(201);
    expect(ok.body).toMatchObject({ memberId: m.id, membershipId: null, attendanceDate: todayIST(), status: 'PRESENT' });
    expect(ok.body.checkInTime).toMatch(/^\d{2}:\d{2}$/);

    const dup = await client.post('/attendance', { memberId: m.id });
    expect(dup.status).toBe(409);
    expect(dup.body.code).toBe('ATTENDANCE_ALREADY_MARKED');

    await env.pool.query('UPDATE gym_settings SET allow_attendance_for_expired_membership = false WHERE id = 1');
    const bad = await client.post('/attendance', { memberId: '00000000-0000-4000-8000-000000000000' });
    expect(bad.body.code).toBe('ATTENDANCE_NOT_ALLOWED');

    const list = await client.get(`/attendance?memberId=${m.id}&fromDate=${todayIST()}&toDate=${todayIST()}`);
    expect(list.body.meta.total).toBe(1);
    expect((await client.get('/attendance?memberId=zzz')).body.code).toBe('INVALID_UUID');
    expect((await client.get('/attendance?toDate=nope')).body.code).toBe('INVALID_DATE');
    const audit = await env.pool.query("SELECT 1 FROM audit_logs WHERE entity_type='ATTENDANCE'");
    expect(audit.rowCount).toBe(1);
  });

  it('links the active membership', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const plan = (await client.post('/membership-plans', { name: 'P', durationInDays: 30, price: 10 })).body;
    const m = (await client.post('/members', { firstName: 'L', lastName: 'K', phone: '9000000005', joiningDate: '2024-01-01' })).body;
    const ms = (await client.post('/memberships', { memberId: m.id, planId: plan.id, startDate: todayIST() })).body;
    const r = await client.post('/attendance', { memberId: m.id });
    expect(r.status).toBe(201);
    expect(r.body.membershipId).toBe(ms.id);
  });

  it('invalid member id with policy on yields INVALID_REFERENCE; trainer may mark', async () => {
    await env.pool.query('UPDATE gym_settings SET allow_attendance_for_expired_membership = true WHERE id = 1');
    const { client } = await loggedIn(env.app, env.pool, 'TRAINER');
    const r = await client.post('/attendance', { memberId: '00000000-0000-4000-8000-000000000000' });
    expect(r.body.code).toBe('INVALID_REFERENCE');
    const { client: rec } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await rec.get('/attendance')).status).toBe(200);
  });
});
