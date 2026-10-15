import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loggedIn, setup } from './helpers/client.js';
import { startTestDb, type TestDb } from './helpers/testdb.js';

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

describe('trainers', () => {
  it('CRUD, validation, permissions, audit', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    expect((await client.post('/trainers', { firstName: 'T', lastName: 'R', phone: '1', joiningDate: 'nope' })).body.code).toBe('VALIDATION_FAILED');

    const c = await client.post('/trainers', { firstName: 'Tom', lastName: 'Lee', phone: '9000000001', joiningDate: '2024-02-01', specialization: 'Yoga' });
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({ trainerCode: expect.stringMatching(/^TRN-\d{3}$/), status: 'ACTIVE', email: null, joiningDate: '2024-02-01' });

    const id = c.body.id;
    const u = await client.patch(`/trainers/${id}`, { status: 'INACTIVE', specialization: 'Boxing' });
    expect(u.body).toMatchObject({ status: 'INACTIVE', specialization: 'Boxing', firstName: 'Tom' });
    expect((await client.patch(`/trainers/${id}`, { status: 'BAD' })).status).toBe(400);
    expect((await client.get('/trainers?status=INACTIVE')).body.meta.total).toBe(1);
    expect((await client.get('/trainers?status=ACTIVE')).body.meta.total).toBe(0);
    expect((await client.get('/trainers/xyz')).body.code).toBe('INVALID_UUID');
    expect((await client.get('/trainers/00000000-0000-0000-0000-000000000000')).body.code).toBe('TRAINER_NOT_FOUND');
    expect((await client.delete(`/trainers/${id}`)).status).toBe(204);

    const audit = await env.pool.query("SELECT action FROM audit_logs WHERE entity_type='TRAINER' ORDER BY timestamp");
    expect(audit.rows.map((r) => r.action)).toEqual(['CREATE', 'UPDATE', 'DELETE']);
  });

  it('permissions', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await client.get('/trainers')).status).toBe(200);
    expect((await client.post('/trainers', {})).status).toBe(403);
    expect((await client.delete('/trainers/00000000-0000-0000-0000-000000000000')).status).toBe(403);
  });

  it('assignment lifecycle', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const m = (await client.post('/members', { firstName: 'A', lastName: 'B', phone: '9111111111', joiningDate: '2024-01-01' })).body;
    const t1 = (await client.post('/trainers', { firstName: 'T', lastName: 'One', phone: '1', joiningDate: '2024-01-01' })).body;
    const t2 = (await client.post('/trainers', { firstName: 'T', lastName: 'Two', phone: '2', joiningDate: '2024-01-01' })).body;

    expect((await client.get(`/members/${m.id}/trainer`)).body.code).toBe('ASSIGNMENT_NOT_FOUND');
    expect((await client.post(`/members/${m.id}/trainer`, {})).body.code).toBe('VALIDATION_FAILED');
    const bad = await client.post(`/members/${m.id}/trainer`, { trainerId: '00000000-0000-0000-0000-000000000000' });
    expect(bad.body.code).toBe('INVALID_REFERENCE');

    const a1 = await client.post(`/members/${m.id}/trainer`, { trainerId: t1.id });
    expect(a1.status).toBe(201);
    expect(a1.body).toMatchObject({ trainerId: t1.id, status: 'ACTIVE', endDate: null });
    const a2 = await client.post(`/members/${m.id}/trainer`, { trainerId: t2.id });
    expect(a2.body.trainerId).toBe(t2.id);
    const rows = await env.pool.query('SELECT status FROM member_trainer_assignments WHERE member_id=$1 ORDER BY created_at', [m.id]);
    expect(rows.rows.map((r) => r.status).sort()).toEqual(['ACTIVE', 'ENDED']);
    expect((await client.get(`/members/${m.id}/trainer`)).body.trainerId).toBe(t2.id);

    // trainer with assignment history cannot be deleted
    expect((await client.delete(`/trainers/${t2.id}`)).body.code).toBe('TRAINER_REFERENCED');
    expect((await client.delete(`/members/${m.id}/trainer`)).status).toBe(204);
    expect((await client.delete(`/members/${m.id}/trainer`)).status).toBe(404);
  });
});
