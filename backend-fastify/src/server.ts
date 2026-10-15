import { loadConfig } from './config.js';
import { Scheduler } from './common/scheduler.js';
import { IST } from './common/time.js';
import { buildApp } from './app.js';
import { createPool } from './db/pool.js';
import { BackupService } from './modules/backup/index.js';
import { registerNotificationJobs } from './modules/notification/index.js';

async function main() {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error('config load failed', err);
    process.exit(1);
  }

  const pool = await createPool(config.databaseUrl);
  const app = await buildApp(config, pool);
  const log = app.log;
  log.info('db pool ready');

  // Register jobs, then catch up on anything missed while the host was off
  // before accepting traffic (doc 09, "Daily shutdown contract").
  const ctx = { pool, config, log };
  const scheduler = new Scheduler(pool, log, IST);
  const backupSvc = new BackupService(ctx);
  registerNotificationJobs(scheduler, ctx, async () => {
    await backupSvc.create(true);
  });
  try {
    await scheduler.runOverdueJobs();
  } catch (err) {
    log.error({ err }, 'overdue-job catch-up failed');
  }
  scheduler.start();

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutdown signal received');
    scheduler.stop();
    try {
      await app.close();
      await pool.end();
      log.info('server stopped');
      process.exit(0);
    } catch (err) {
      log.error({ err }, 'graceful shutdown failed');
      process.exit(1);
    }
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.port, host: '0.0.0.0' });
  log.info({ port: config.port, env: config.env }, 'server starting');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
