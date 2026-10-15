import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { createPool, newId } from '../src/db/pool.js';
import { loggedIn, setup, testConfig } from './helpers/client.js';
import { startTestDb, type TestDb } from './helpers/testdb.js';

let db: TestDb;
let env: Awaited<ReturnType<typeof setup>>;
let owner: Awaited<ReturnType<typeof loggedIn>>;

beforeAll(async () => {
  db = await startTestDb();
  env = await setup(db.url);
  owner = await loggedIn(env.app, env.pool, 'OWNER');
}, 120_000);
afterAll(async () => {
  await env?.close();
  await db?.stop();
});

describe('report', () => {
  it('overview aggregates the default month and honours ranges', async () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    await owner.client.post('/members', { firstName: 'Rep', lastName: 'Ort', phone: '9000000001', joiningDate: today });
    const cat = newId();
    await env.pool.query("INSERT INTO expense_categories (id, name) VALUES (?, 'Rent')", [cat]);
    await env.pool.query(
      `INSERT INTO expenses (id, expense_code, category_id, description, amount, expense_date, payment_method)
       VALUES (?, 'EXP-900', ?, 'rent', 1500.50, ?, 'CASH')`,
      [newId(), cat, today],
    );
    const r = await owner.client.get('/reports/overview');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      revenue: '0', expenses: '1500.5', netCashFlow: '-1500.5', activeMembers: 1, newMembers: 1,
      attendanceCount: 0, newLeads: 0,
    });
    expect(r.body.revenueVsExpenses).toEqual([
      { month: expect.stringMatching(/^[A-Z][a-z]{2} '\d{2}$/), revenue: '0', expenses: '1500.5' },
    ]);
    expect((await owner.client.get('/reports/leads')).body.expenses).toBe('1500.5');

    const old = await owner.client.get('/reports/overview?fromDate=2000-01-01&toDate=2000-12-31');
    expect(old.body).toMatchObject({ expenses: '0', newMembers: 0, revenueVsExpenses: [] });
    const bad = await owner.client.get('/reports/overview?fromDate=2024-13-01');
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('INVALID_DATE');
  });

  it('requires reports:view', async () => {
    const { client } = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await client.get('/reports/overview')).status).toBe(403);
  });
});

describe('settings', () => {
  it('get, update, validation, permissions, audit', async () => {
    const g = await owner.client.get('/settings');
    expect(g.body).toMatchObject({ gymName: 'My Gym', currency: 'INR', phone: null, membershipGracePeriodDays: 0 });

    const u = await owner.client.patch('/settings', { gymName: 'Iron', membershipGracePeriodDays: 3, attendanceStartTime: '05:00', attendanceEndTime: '22:00' });
    expect(u.status).toBe(200);
    expect(u.body).toMatchObject({ gymName: 'Iron', membershipGracePeriodDays: 3, currency: 'INR', attendanceEndTime: '22:00' });

    const t = await owner.client.patch('/settings', { attendanceStartTime: '10:00', attendanceEndTime: '09:00' });
    expect(t.body.code).toBe('INVALID_TIME_RANGE');
    expect((await owner.client.patch('/settings', { currency: 'RUPEES' })).body.code).toBe('VALIDATION_FAILED');
    expect((await owner.client.patch('/settings', { membershipGracePeriodDays: -1 })).status).toBe(400);

    const admin = await loggedIn(env.app, env.pool, 'ADMIN');
    expect((await admin.client.get('/settings')).status).toBe(200);
    expect((await admin.client.patch('/settings', { gymName: 'x' })).status).toBe(403);

    const [a] = await env.pool.query("SELECT entity_id FROM audit_logs WHERE entity_type='SETTINGS'");
    expect(a).toEqual([{ entity_id: '1' }]);
  });
});

describe('audit', () => {
  it('lists with filters, gets by id, enforces permission', async () => {
    const all = await owner.client.get('/audit-logs?pageSize=100');
    expect(all.status).toBe(200);
    expect(all.body.data.length).toBeGreaterThan(0);
    expect(all.body.data[0]).toHaveProperty('entityId');

    const filtered = await owner.client.get('/audit-logs?entityType=SETTINGS&action=UPDATE&status=SUCCESS');
    expect(filtered.body.meta.total).toBe(1);
    expect(filtered.body.data[0].metadata).toBeUndefined();

    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date());
    expect((await owner.client.get(`/audit-logs?fromDate=${today}&toDate=${today}`)).body.meta.total).toBeGreaterThan(0);
    expect((await owner.client.get('/audit-logs?toDate=2000-01-01')).body.meta.total).toBe(0);
    expect((await owner.client.get('/audit-logs?fromDate=nope')).body.code).toBe('INVALID_DATE');
    expect((await owner.client.get('/audit-logs?userId=zzz')).body.code).toBe('INVALID_UUID');

    const one = await owner.client.get(`/audit-logs/${all.body.data[0].id}`);
    expect(one.body.id).toBe(all.body.data[0].id);
    expect((await owner.client.get('/audit-logs/00000000-0000-0000-0000-000000000000')).body.code).toBe('AUDIT_NOT_FOUND');
    expect((await owner.client.get('/audit-logs/xyz')).body.code).toBe('INVALID_UUID');

    const rec = await loggedIn(env.app, env.pool, 'RECEPTIONIST');
    expect((await rec.client.get('/audit-logs')).status).toBe(403);
  });
});

describe('search', () => {
  it('validates length and filters groups by permission', async () => {
    await env.pool.query(
      `INSERT INTO trainers (id, trainer_code, first_name, last_name, phone, joining_date) VALUES (UUID(),'TRN-900','Zed','Coach','8000000001','2024-01-01')`);
    await env.pool.query(`INSERT INTO leads (id, lead_code, name, phone) VALUES (UUID(), 'LEAD-900','Zed Lead','7000000001')`);
    await owner.client.post('/members', { firstName: 'Zed', lastName: 'Member', phone: '9000000002', joiningDate: '2024-01-01' });

    expect((await owner.client.get('/search?q=z')).body.code).toBe('QUERY_TOO_SHORT');
    const r = await owner.client.get('/search?q=zed');
    expect(r.body.members).toEqual([expect.objectContaining({ name: 'Zed Member', phone: '9000000002' })]);
    expect(r.body.trainers[0]).toMatchObject({ trainerCode: 'TRN-900', name: 'Zed Coach' });
    expect(r.body.leads[0]).toMatchObject({ leadCode: 'LEAD-900', name: 'Zed Lead' });

    const trainer = await loggedIn(env.app, env.pool, 'TRAINER');
    const t = await trainer.client.get('/search?q=zed');
    expect(t.body.members.length).toBe(1);
    expect(t.body.trainers.length).toBe(1);
    expect(t.body.leads).toEqual([]);
  });
});

describe('backup', () => {
  let dir: string;
  let app: Awaited<ReturnType<typeof buildApp>>;
  let owner2: Awaited<ReturnType<typeof loggedIn>>;
  let restored: string;
  let pool: Awaited<ReturnType<typeof createPool>>;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'gym-backup-'));
    restored = join(dir, 'restored.txt');
    const dump = join(dir, 'fake_mysqldump.sh');
    writeFileSync(dump, `#!/bin/sh
echo "-- fake dump pw=$MYSQL_PWD args=$*"
`);
    const mysqlBin = join(dir, 'fake_mysql.sh');
    writeFileSync(mysqlBin, `#!/bin/sh\ncat > "${restored}"\n`);
    chmodSync(dump, 0o755);
    chmodSync(mysqlBin, 0o755);
    pool = await createPool(db.url);
    app = await buildApp(
      { ...testConfig('mysql://gymuser:s3cret@localhost:3306/gymdb'), databaseUrl: 'mysql://gymuser:s3cret@localhost:3306/gymdb',
        backupDir: join(dir, 'out'), mysqlDumpBin: dump, mysqlBin: mysqlBin },
      pool,
    );
    await app.ready();
    owner2 = await loggedIn(app, pool, 'OWNER');
  });
  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('creates, lists and restores; only OWNER may', async () => {
    expect((await owner2.client.get('/backup/list')).body).toEqual([]);
    const c = await owner2.client.post('/backup/create');
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({ name: expect.stringMatching(/^gymdb_\d{8}_\d{6}\.sql$/), triggeredBy: owner2.user.id });
    expect(c.body.sizeBytes).toBeGreaterThan(0);
    // password travels via env, not argv/URL
    expect(readFileSync(join(dir, 'out', c.body.name), 'utf8')).toContain('pw=s3cret');

    const l = await owner2.client.get('/backup/list');
    expect(l.body).toHaveLength(1);
    expect(l.body[0].name).toBe(c.body.name);

    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    const csrf = (await owner2.client.get('/csrf-token')).body.token;
    const cookie = (owner2.client as any).cookieHeader();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/backup/restore',
      headers: { cookie, 'x-csrf-token': csrf, 'content-type': 'application/sql' },
      payload: 'SELECT 1;',
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ status: 'restored', restarting: true });
    expect(readFileSync(restored, 'utf8')).toBe('SELECT 1;');
    await new Promise((r) => setTimeout(r, 250));
    expect(kill).toHaveBeenCalledWith(process.pid, 'SIGTERM');
    kill.mockRestore();

    const empty = await app.inject({
      method: 'POST', url: '/api/v1/backup/restore',
      headers: { cookie, 'x-csrf-token': csrf, 'content-type': 'application/sql', 'content-length': '0' },
    });
    expect(empty.statusCode).toBe(400);
    expect(empty.json().code).toBe('EMPTY_BODY');

    const admin = await loggedIn(app, pool, 'ADMIN');
    expect((await admin.client.get('/backup/list')).status).toBe(403);
    expect((await admin.client.post('/backup/create')).status).toBe(403);
  });

  it('daily create is idempotent per date; failures map to BACKUP_FAILED', async () => {
    const { BackupService } = await import('../src/modules/backup/index.js');
    const ctx = { pool, log: app.log, config: { ...testConfig(db.url), backupDir: join(dir, 'daily'), mysqlDumpBin: join(dir, 'fake_mysqldump.sh') } };
    const svc = new BackupService(ctx as any);
    const a = await svc.create(true);
    const b = await svc.create(true);
    expect(a.name).toMatch(/^gymdb_\d{8}\.sql$/);
    expect(b).toEqual(a);

    const bad = new BackupService({ ...ctx, config: { ...ctx.config, backupDir: join(dir, 'bad'), mysqlDumpBin: '/nonexistent/mysqldump' } } as any);
    await expect(bad.create(false)).rejects.toThrow(/mysqldump failed/);
  });
});
