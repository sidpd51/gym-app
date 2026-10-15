import { badRequest } from '../../common/errors.js';
import { hasPermission, type Role } from '../../common/permissions.js';
import { toSearchResponse } from './search.model.js';
import type { SearchRepository } from './search.repository.js';

const MIN_QUERY_LEN = 2;

export class SearchService {
  constructor(private readonly repo: SearchRepository) {}

  /** Searches only the entities the caller's role may view. */
  async search(q: string, role: Role) {
    // Go compares byte length.
    if (Buffer.byteLength(q) < MIN_QUERY_LEN) {
      throw badRequest('QUERY_TOO_SHORT', 'Search query must be at least 2 characters.');
    }
    const [members, trainers, leads] = await Promise.all([
      hasPermission(role, 'members:view') ? this.repo.members(q) : [],
      hasPermission(role, 'trainers:view') ? this.repo.trainers(q) : [],
      hasPermission(role, 'leads:view') ? this.repo.leads(q) : [],
    ]);
    return toSearchResponse(members, trainers, leads);
  }
}
