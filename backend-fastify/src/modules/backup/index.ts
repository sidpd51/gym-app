import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { FastifyPluginAsync } from 'fastify';
import { AppError, badRequest, internalError } from '../../common/errors.js';
import { actorId } from '../../plugins/auth.js';
import type { ModuleContext } from '../context.js';

export interface BackupFile {
  name: string;
  sizeBytes: number;
  createdAt: Date;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** Wraps pg_dump / psql via child_process. BackupDir is created on first use. */
export class BackupService {
  /** Called after a successful restore; default raises SIGTERM so the service manager restarts us. */
  restartHook: () => void = () => {
    process.kill(process.pid, 'SIGTERM');
  };

  constructor(private readonly ctx: ModuleContext) {}

  private get cfg() {
    return this.ctx.config;
  }

  /**
   * Runs pg_dump into gymdb_YYYYMMDD[_HHMMSS].sql. With idempotentDaily the
   * name drops the time portion, so same-day re-runs are no-ops. Docker mode
   * (BACKUP_USE_DOCKER_EXEC) streams pg_dump stdout from inside the DB container.
   */
  async create(idempotentDaily: boolean): Promise<BackupFile> {
    await mkdir(this.cfg.backupDir, { recursive: true, mode: 0o750 });
    const d = new Date();
    const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const name = idempotentDaily ? `gymdb_${date}.sql` : `gymdb_${date}_${time}.sql`;
    const path = join(this.cfg.backupDir, name);

    if (idempotentDaily) {
      const info = await stat(path).catch(() => null);
      if (info) return { name, sizeBytes: info.size, createdAt: info.mtime };
    }

    const url = this.cfg.databaseUrl;
    if (this.cfg.backupUseDockerExec) {
      const { user, dbname } = dbParts(url);
      const out = createWriteStream(path);
      const res = await run(
        'docker',
        ['exec', '-i', '-e', `PGPASSWORD=${dbPassword(url)}`, this.cfg.backupDockerContainer, 'pg_dump',
          '-h', 'localhost', '-U', user, '-d', dbname, '--no-owner', '--no-privileges', '--format=plain'],
        { stdout: out },
      );
      if (res.code !== 0) {
        await rm(path, { force: true });
        throw new Error(`docker pg_dump failed: ${res.error ?? `exit ${res.code}`}: ${res.stderr}`);
      }
    } else {
      const res = await run(
        this.cfg.pgDumpBin || 'pg_dump',
        ['--no-owner', '--no-privileges', '--format=plain', '--file', path, connString(url)],
        { env: passwordEnv(url) },
      );
      if (res.code !== 0) {
        await rm(path, { force: true });
        throw new Error(`pg_dump failed: ${res.error ?? `exit ${res.code}`}: ${res.stdout}${res.stderr}`);
      }
    }
    const info = await stat(path);
    return { name, sizeBytes: info.size, createdAt: info.mtime };
  }

  async list(): Promise<BackupFile[]> {
    let entries;
    try {
      entries = await readdir(this.cfg.backupDir, { withFileTypes: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: BackupFile[] = [];
    for (const e of entries) {
      if (e.isDirectory() || !e.name.endsWith('.sql')) continue;
      try {
        const info = await stat(join(this.cfg.backupDir, e.name));
        out.push({ name: e.name, sizeBytes: info.size, createdAt: info.mtime });
      } catch {
        continue;
      }
    }
    return out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Streams a SQL dump into `psql` (locally, or inside the DB container in docker mode). */
  async restore(sql: Readable): Promise<void> {
    const url = this.cfg.databaseUrl;
    if (this.cfg.backupUseDockerExec) {
      const { user, dbname } = dbParts(url);
      const res = await run(
        'docker',
        ['exec', '-i', '-e', `PGPASSWORD=${dbPassword(url)}`, this.cfg.backupDockerContainer, 'psql',
          '-h', 'localhost', '-U', user, '-d', dbname, '--set', 'ON_ERROR_STOP=on'],
        { stdin: sql },
      );
      if (res.code !== 0) throw new Error(`docker psql restore failed: ${res.error ?? `exit ${res.code}`}: ${res.stderr}`);
      return;
    }
    const res = await run(this.cfg.psqlBin || 'psql', ['--set', 'ON_ERROR_STOP=on', connString(url)], {
      stdin: sql,
      env: passwordEnv(url),
    });
    if (res.code !== 0) throw new Error(`psql restore failed: ${res.error ?? `exit ${res.code}`}: ${res.stdout}${res.stderr}`);
  }
}

// --- helpers ---------------------------------------------------------------

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

function run(
  bin: string,
  args: string[],
  opts: { env?: Record<string, string>; stdin?: Readable; stdout?: NodeJS.WritableStream } = {},
): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { env: { ...process.env, ...opts.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let error: string | undefined;
    if (opts.stdout) child.stdout.pipe(opts.stdout);
    else child.stdout.on('data', (b) => (stdout += b));
    child.stderr.on('data', (b) => (stderr += b));
    child.on('error', (e) => {
      error = e.message;
      resolve({ code: -1, stdout, stderr, error });
    });
    child.on('close', (code) => resolve({ code, stdout, stderr, error }));
    child.stdin.on('error', () => undefined); // child may exit before consuming all input
    if (opts.stdin) pipeline(opts.stdin, child.stdin).catch(() => undefined);
    else child.stdin.end();
  });
}

/** DATABASE_URL minus the password (which goes to PGPASSWORD so it never shows in process listings). */
function connString(databaseUrl: string): string {
  const u = new URL(databaseUrl);
  u.password = '';
  return u.toString();
}

function passwordEnv(databaseUrl: string): Record<string, string> {
  const pw = dbPassword(databaseUrl);
  return pw ? { PGPASSWORD: pw } : {};
}

function dbPassword(databaseUrl: string): string {
  try {
    return decodeURIComponent(new URL(databaseUrl).password);
  } catch {
    return '';
  }
}

/** user/dbname for docker-exec mode; host is irrelevant (always -h localhost inside the container). */
function dbParts(databaseUrl: string): { user: string; dbname: string } {
  const u = new URL(databaseUrl);
  const dbname = u.pathname.replace(/^\//, '');
  const user = decodeURIComponent(u.username);
  if (!user || !dbname) throw new Error('DATABASE_URL must include user and dbname');
  return { user, dbname };
}

// --- routes ----------------------------------------------------------------

export function backupModule(ctx: ModuleContext): FastifyPluginAsync {
  const svc = new BackupService(ctx);
  return async (app) => {
    // OWNER-only via settings:edit (which only OWNER has).
    const guard = { onRequest: [app.requirePermission('settings:edit')] };

    app.post('/backup/create', guard, async (req, reply) => {
      try {
        const bf = await svc.create(false);
        return reply.status(201).send({ ...bf, triggeredBy: actorId(req) });
      } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError('BACKUP_FAILED', 500, internalError().message, undefined, err);
      }
    });

    app.get('/backup/list', guard, async () => svc.list());

    // Raw-body upload: own scope so the catch-all stream parser doesn't affect other routes.
    await app.register(async (up) => {
      up.removeAllContentTypeParsers();
      up.addContentTypeParser('*', (_req, payload, done) => done(null, payload));

      up.post('/backup/restore', { ...guard, bodyLimit: 4 * 1024 ** 3 }, async (req, reply) => {
        if (req.headers['content-length'] === '0' || !req.body) {
          throw badRequest('EMPTY_BODY', 'Upload a .sql dump as the request body.');
        }
        try {
          await svc.restore(req.body as Readable);
        } catch (err) {
          throw new AppError('RESTORE_FAILED', 500, internalError().message, undefined, err);
        }
        // Graceful restart so the service manager gives us a fresh connection pool.
        setTimeout(() => svc.restartHook(), 100).unref();
        return reply.status(202).type('application/json').send('{"status":"restored","restarting":true}');
      });
    });
  };
}
