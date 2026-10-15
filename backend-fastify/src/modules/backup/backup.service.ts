import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ModuleContext } from '../context.js';
import type { BackupFile } from './backup.model.js';

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** Wraps mysqldump / mysql via child_process. BackupDir is created on first use. */
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
   * Runs mysqldump into gymdb_YYYYMMDD[_HHMMSS].sql. With idempotentDaily the
   * name drops the time portion, so same-day re-runs are no-ops. Docker mode
   * (BACKUP_USE_DOCKER_EXEC) streams mysqldump stdout from inside the DB container.
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
    const c = connParts(url);
    const dumpArgs = ['--single-transaction', '--routines', '--no-tablespaces', '--default-character-set=utf8mb4'];
    if (this.cfg.backupUseDockerExec) {
      const out = createWriteStream(path);
      const res = await run(
        'docker',
        ['exec', '-i', '-e', `MYSQL_PWD=${c.password}`, this.cfg.backupDockerContainer, 'mysqldump',
          '-h', 'localhost', '-u', c.user, ...dumpArgs, c.dbname],
        { stdout: out },
      );
      if (res.code !== 0) {
        await rm(path, { force: true });
        throw new Error(`docker mysqldump failed: ${res.error ?? `exit ${res.code}`}: ${res.stderr}`);
      }
    } else {
      const out = createWriteStream(path);
      const res = await run(
        this.cfg.mysqlDumpBin || 'mysqldump',
        ['-h', c.host, '-P', c.port, '-u', c.user, ...dumpArgs, c.dbname],
        { env: passwordEnv(c.password), stdout: out },
      );
      if (res.code !== 0) {
        await rm(path, { force: true });
        throw new Error(`mysqldump failed: ${res.error ?? `exit ${res.code}`}: ${res.stderr}`);
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

  /** Streams a SQL dump into `mysql` (locally, or inside the DB container in docker mode). */
  async restore(sql: Readable): Promise<void> {
    const c = connParts(this.cfg.databaseUrl);
    if (this.cfg.backupUseDockerExec) {
      const res = await run(
        'docker',
        ['exec', '-i', '-e', `MYSQL_PWD=${c.password}`, this.cfg.backupDockerContainer, 'mysql',
          '-h', 'localhost', '-u', c.user, c.dbname],
        { stdin: sql },
      );
      if (res.code !== 0) throw new Error(`docker mysql restore failed: ${res.error ?? `exit ${res.code}`}: ${res.stderr}`);
      return;
    }
    const res = await run(this.cfg.mysqlBin || 'mysql', ['-h', c.host, '-P', c.port, '-u', c.user, c.dbname], {
      stdin: sql,
      env: passwordEnv(c.password),
    });
    if (res.code !== 0) throw new Error(`mysql restore failed: ${res.error ?? `exit ${res.code}`}: ${res.stdout}${res.stderr}`);
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

/** Password goes via MYSQL_PWD so it never shows in process listings. */
function passwordEnv(password: string): Record<string, string> {
  return password ? { MYSQL_PWD: password } : {};
}

/** Host/port/user/password/dbname from a mysql://user:pass@host:port/db DATABASE_URL. */
function connParts(databaseUrl: string): { host: string; port: string; user: string; password: string; dbname: string } {
  const u = new URL(databaseUrl);
  const dbname = u.pathname.replace(/^\//, '');
  const user = decodeURIComponent(u.username);
  if (!user || !dbname) throw new Error('DATABASE_URL must include user and dbname');
  return {
    host: u.hostname || '127.0.0.1',
    port: u.port || '3306',
    user,
    password: decodeURIComponent(u.password),
    dbname,
  };
}
