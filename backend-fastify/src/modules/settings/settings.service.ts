import { auditLog } from '../../common/audit.js';
import { badRequest } from '../../common/errors.js';
import { withTx, type DbPool } from '../../db/pool.js';
import { toSettingsResponse } from './settings.model.js';
import type { SettingsRepository } from './settings.repository.js';
import type { SettingsInput } from './settings.schemas.js';

export class SettingsService {
  constructor(
    private readonly pool: DbPool,
    private readonly repo: SettingsRepository,
  ) {}

  async get() {
    return toSettingsResponse((await this.repo.get())!);
  }

  async update(actor: string, r: SettingsInput) {
    if (r.attendanceStartTime != null && r.attendanceEndTime != null && r.attendanceEndTime <= r.attendanceStartTime) {
      throw badRequest('INVALID_TIME_RANGE', 'attendanceEndTime must be after attendanceStartTime.');
    }
    const row = await withTx(this.pool, async (tx) => {
      const updated = await this.repo.update(r, tx);
      await auditLog(tx, { userId: actor, action: 'UPDATE', entityType: 'SETTINGS', entityId: '1', description: 'Updated gym settings' });
      return updated!;
    });
    return toSettingsResponse(row);
  }
}
