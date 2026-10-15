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

describe('equipment', () => {
  it('category CRUD, equipment CRUD, maintenance, conflicts and audit', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'OWNER');

    const cat = await client.post('/equipment-categories', { name: 'Cardio', description: 'Machines' });
    expect(cat.status).toBe(201);
    expect(cat.body).toMatchObject({ name: 'Cardio', description: 'Machines', status: 'ACTIVE' });
    expect((await client.post('/equipment-categories', { name: '' })).body.code).toBe('VALIDATION_FAILED');

    const upd = await client.patch(`/equipment-categories/${cat.body.id}`, { status: 'INACTIVE' });
    expect(upd.body).toMatchObject({ name: 'Cardio', status: 'INACTIVE' });
    expect((await client.patch('/equipment-categories/00000000-0000-4000-8000-000000000000', {})).body.code).toBe('CATEGORY_NOT_FOUND');
    expect((await client.get('/equipment-categories')).body).toHaveLength(1);

    const bad = await client.post('/equipment', { name: 'Treadmill', categoryId: '00000000-0000-4000-8000-000000000000' });
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('INVALID_REFERENCE');
    expect((await client.post('/equipment', { name: 'T', categoryId: 'nope' })).body.code).toBe('VALIDATION_FAILED');

    const eq = await client.post('/equipment', {
      name: 'Treadmill', categoryId: cat.body.id, purchaseDate: '2024-03-01', purchaseCost: 1500.5, brand: 'Acme',
    });
    expect(eq.status).toBe(201);
    expect(eq.body).toMatchObject({
      equipmentCode: expect.stringMatching(/^EQP-\d{3}$/), status: 'ACTIVE', purchaseDate: '2024-03-01',
      purchaseCost: '1500.5', brand: 'Acme', model: null,
    });

    const patched = await client.patch(`/equipment/${eq.body.id}`, { status: 'UNDER_MAINTENANCE', location: 'Floor 1' });
    expect(patched.body).toMatchObject({ status: 'UNDER_MAINTENANCE', location: 'Floor 1', name: 'Treadmill' });

    const list = await client.get(`/equipment?status=UNDER_MAINTENANCE&categoryId=${cat.body.id}`);
    expect(list.body.meta.total).toBe(1);
    expect((await client.get('/equipment?categoryId=bad')).body.code).toBe('INVALID_UUID');
    expect((await client.get('/equipment/bad')).body.code).toBe('INVALID_UUID');

    const m = await client.post(`/equipment/${eq.body.id}/maintenance`, {
      maintenanceDate: '2024-05-01', maintenanceType: 'REPAIR', description: 'Belt', cost: '200.00', nextMaintenanceDate: '2024-11-01',
    });
    expect(m.status).toBe(201);
    expect(m.body).toMatchObject({ cost: '200', nextMaintenanceDate: '2024-11-01', performedBy: null });
    expect((await client.post(`/equipment/${eq.body.id}/maintenance`, { maintenanceDate: '2024-05-01', maintenanceType: 'X', description: 'd' })).status).toBe(400);
    const ref = await client.post('/equipment/00000000-0000-4000-8000-000000000000/maintenance', {
      maintenanceDate: '2024-05-01', maintenanceType: 'ROUTINE', description: 'd',
    });
    expect(ref.body.code).toBe('INVALID_REFERENCE');
    expect((await client.get(`/equipment/${eq.body.id}/maintenance`)).body).toHaveLength(1);

    expect((await client.delete(`/equipment-categories/${cat.body.id}`)).body.code).toBe('CATEGORY_REFERENCED');
    expect((await client.delete(`/equipment/${eq.body.id}`)).body.code).toBe('EQUIPMENT_REFERENCED');
    await env.pool.query('DELETE FROM equipment_maintenance');
    expect((await client.delete(`/equipment/${eq.body.id}`)).status).toBe(204);
    expect((await client.get(`/equipment/${eq.body.id}`)).body.code).toBe('EQUIPMENT_NOT_FOUND');
    expect((await client.delete(`/equipment-categories/${cat.body.id}`)).status).toBe(204);

    const [auditRows] = await env.pool.query("SELECT entity_type, action FROM audit_logs WHERE entity_type LIKE 'EQUIPMENT%'");
    const audit = { rows: auditRows as Array<{ entity_type: string; action: string }> };
    expect(audit.rows.some((r) => r.entity_type === 'EQUIPMENT_MAINTENANCE' && r.action === 'CREATE')).toBe(true);
    expect(audit.rows.filter((r) => r.action === 'DELETE')).toHaveLength(2);
  });

  it('enforces permissions', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await client.get('/equipment')).status).toBe(403);
    const admin = await loggedIn(env.app, env.pool, 'ADMIN');
    expect((await admin.client.get('/equipment')).status).toBe(200);
  });
});
