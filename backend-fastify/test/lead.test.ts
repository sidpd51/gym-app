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

describe('leads', () => {
  it('CRUD, filters, validation, audit', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    expect((await client.post('/leads', { name: 'X', phone: '1', source: 'BOGUS' })).body.code).toBe('VALIDATION_FAILED');
    const c = await client.post('/leads', { name: 'Lia', phone: '9222222222', source: 'WALK_IN', nextFollowUpDate: '2030-01-05', notes: 'hi' });
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({
      leadCode: expect.stringMatching(/^LEAD-\d{3}$/), status: 'NEW', source: 'WALK_IN', nextFollowUpDate: '2030-01-05',
      lastFollowUpDate: null, convertedMemberId: null, interestedPlanId: null, email: null,
    });
    const id = c.body.id;
    const u = await client.patch(`/leads/${id}`, { status: 'CONTACTED', lastFollowUpDate: '2030-01-01' });
    expect(u.body).toMatchObject({ status: 'CONTACTED', lastFollowUpDate: '2030-01-01', name: 'Lia', notes: 'hi' });
    expect((await client.patch(`/leads/${id}`, { status: 'NOPE' })).status).toBe(400);
    expect((await client.get('/leads?status=CONTACTED')).body.meta.total).toBe(1);
    expect((await client.get('/leads?status=LOST')).body.data).toEqual([]);
    expect((await client.get('/leads/00000000-0000-0000-0000-000000000000')).body.code).toBe('LEAD_NOT_FOUND');
    expect((await client.delete(`/leads/${id}`)).status).toBe(204);
    const audit = await env.pool.query("SELECT action FROM audit_logs WHERE entity_type='LEAD' ORDER BY timestamp");
    expect(audit.rows.map((r) => r.action)).toEqual(['CREATE', 'UPDATE', 'DELETE']);
  });

  it('permissions: trainer cannot view, receptionist cannot delete', async () => {
    expect((await (await loggedIn(env.app, env.pool, 'TRAINER')).client.get('/leads')).status).toBe(403);
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await client.get('/leads')).status).toBe(200);
    expect((await client.delete('/leads/00000000-0000-0000-0000-000000000000')).status).toBe(403);
  });

  it('convert lead to member', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');
    const lead = (await client.post('/leads', { name: 'Conv', phone: '9333333333', email: 'conv@x.dev' })).body;
    expect((await client.post(`/leads/${lead.id}/convert`, { firstName: 'A', lastName: 'B', joiningDate: '2024-03-01', phone: '12' })).status).toBe(400);

    const r = await client.post(`/leads/${lead.id}/convert`, { firstName: 'Con', lastName: 'Vert', joiningDate: '2024-03-01', phone: '9333333333' });
    expect(r.status).toBe(201);
    const member = await client.get(`/members/${r.body.memberId}`);
    expect(member.body).toMatchObject({ firstName: 'Con', email: 'conv@x.dev', status: 'ACTIVE' });
    const after = (await client.get(`/leads/${lead.id}`)).body;
    expect(after).toMatchObject({ status: 'CONVERTED', convertedMemberId: r.body.memberId });

    const again = await client.post(`/leads/${lead.id}/convert`, { firstName: 'Con', lastName: 'Vert', joiningDate: '2024-03-01', phone: '9333333334' });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('LEAD_ALREADY_CONVERTED');

    const other = (await client.post('/leads', { name: 'Dup', phone: '9444444444' })).body;
    const dup = await client.post(`/leads/${other.id}/convert`, { firstName: 'D', lastName: 'P', joiningDate: '2024-03-01', phone: '9333333333' });
    expect(dup.body.code).toBe('MEMBER_PHONE_DUPLICATE');
    expect((await client.get(`/leads/${other.id}`)).body.status).toBe('NEW');
  });
});
