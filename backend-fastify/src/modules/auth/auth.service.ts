import { auditLog } from '../../common/audit.js';
import { forbidden, unauthenticated } from '../../common/errors.js';
import type { DbPool } from '../../db/pool.js';
import type { Signer } from '../../plugins/auth.js';
import { toUserResponse } from '../user/user.model.js';
import type { UpdateProfileInput } from '../user/user.schemas.js';
import type { UserService } from '../user/user.service.js';
import type { LoginInput } from './auth.schemas.js';

/** Session orchestration on top of the user service. No SQL, no HTTP/cookies. */
export class AuthService {
  constructor(
    private readonly pool: DbPool,
    private readonly users: UserService,
    private readonly signer: Signer,
  ) {}

  get sessionTtlSeconds(): number {
    return this.signer.ttlSeconds;
  }

  async login(req: LoginInput) {
    const u = await this.users.getByEmail(req.email.toLowerCase());
    if (!u) {
      // No user to attribute an audit row to (user_id is NOT NULL FK); same generic error as wrong password.
      throw unauthenticated('AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    const name = `${u.first_name} ${u.last_name}`;
    const failed = (description: string) =>
      auditLog(this.pool, {
        userId: u.id, action: 'LOGIN', entityType: 'USER', entityId: u.id, entityName: name,
        description, status: 'FAILED',
      }).catch(() => undefined);

    if (!(await this.users.verifyPassword(u.password_hash, req.password))) {
      await failed('Failed login: wrong password');
      throw unauthenticated('AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    if (u.status !== 'ACTIVE') {
      await failed('Failed login: inactive account');
      throw forbidden('AUTH_ACCOUNT_INACTIVE', 'Your account has been deactivated.');
    }

    const token = this.signer.sign(u.id, u.role);
    await this.users.markLoggedIn(u.id);
    await auditLog(this.pool, {
      userId: u.id, action: 'LOGIN', entityType: 'USER', entityId: u.id, entityName: name, description: 'User logged in',
    }).catch(() => undefined);

    return { token, user: toUserResponse(u) };
  }

  /** Best-effort audit of a logout; invalid/expired tokens or audit failures are ignored. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    try {
      const claims = this.signer.verify(rawToken);
      await auditLog(this.pool, {
        userId: claims.sub, action: 'LOGOUT', entityType: 'USER', entityId: claims.sub, description: 'User logged out',
      });
    } catch {
      /* still clear the cookie */
    }
  }

  me(userId: string) {
    return this.users.getById(userId);
  }

  updateProfile(userId: string, req: UpdateProfileInput) {
    return this.users.updateProfile(userId, req);
  }
}
