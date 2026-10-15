import 'dotenv/config';
import { z } from 'zod';

/** Parses Go-style durations ("8h", "30m", "1h30m", "90s"). */
export function parseDuration(input: string): number {
  const re = /(\d+(?:\.\d+)?)(ms|s|m|h)/g;
  const unit: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
  let total = 0;
  let consumed = 0;
  for (const m of input.matchAll(re)) {
    total += parseFloat(m[1]) * unit[m[2]];
    consumed += m[0].length;
  }
  if (consumed === 0 || consumed !== input.length) throw new Error(`invalid duration: ${input}`);
  return total;
}

const schema = z.object({
  ENV: z.string().default('prod'),
  PORT: z.coerce.number().int().default(8080),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  COOKIE_SECRET: z.string().min(1),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  SESSION_TTL: z.string().default('8h'),
  BACKUP_DIR: z.string().default('/opt/gym-backups'),
  LOG_LEVEL: z.string().default('info'),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().default(5),
  HTTPS_CERT: z.string().optional(),
  HTTPS_KEY: z.string().optional(),
  PGDUMP_BIN: z.string().optional(),
  PSQL_BIN: z.string().optional(),
  BACKUP_USE_DOCKER_EXEC: z.string().optional(),
  BACKUP_DOCKER_CONTAINER: z.string().optional(),
});

export interface Config {
  env: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  cookieSecret: string;
  frontendOrigin: string;
  sessionTtlMs: number;
  backupDir: string;
  logLevel: string;
  /** Max login attempts per IP per minute. */
  loginRateLimitMax: number;
  httpsCert?: string;
  httpsKey?: string;
  pgDumpBin?: string;
  psqlBin?: string;
  backupUseDockerExec: boolean;
  backupDockerContainer: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const e = schema.parse(env);
  return {
    env: e.ENV,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    jwtSecret: e.JWT_SECRET,
    cookieSecret: e.COOKIE_SECRET,
    frontendOrigin: e.FRONTEND_ORIGIN,
    sessionTtlMs: parseDuration(e.SESSION_TTL),
    backupDir: e.BACKUP_DIR,
    logLevel: e.LOG_LEVEL,
    loginRateLimitMax: e.LOGIN_RATE_LIMIT_MAX,
    httpsCert: e.HTTPS_CERT || undefined,
    httpsKey: e.HTTPS_KEY || undefined,
    pgDumpBin: e.PGDUMP_BIN || undefined,
    psqlBin: e.PSQL_BIN || undefined,
    backupUseDockerExec: e.BACKUP_USE_DOCKER_EXEC === '1' || e.BACKUP_USE_DOCKER_EXEC === 'true',
    backupDockerContainer: e.BACKUP_DOCKER_CONTAINER || 'gym-postgres',
  };
}
