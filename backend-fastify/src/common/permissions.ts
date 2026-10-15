export type Role = 'OWNER' | 'ADMIN' | 'RECEPTIONIST' | 'TRAINER';

/** Mirrors frontend/src/features/auth/permissions/permissions.ts verbatim. */
export const ALL_PERMISSIONS = [
  'dashboard:view',
  'members:view', 'members:create', 'members:edit', 'members:delete',
  'memberships:view', 'memberships:create',
  'membership-plans:view', 'membership-plans:create', 'membership-plans:edit', 'membership-plans:delete',
  'attendance:view', 'attendance:mark',
  'payments:view', 'payments:record',
  'trainers:view', 'trainers:create', 'trainers:edit', 'trainers:delete',
  'leads:view', 'leads:create', 'leads:edit', 'leads:delete',
  'expenses:view', 'expenses:create', 'expenses:edit', 'expenses:delete',
  'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
  'equipment:view', 'equipment:create', 'equipment:edit', 'equipment:delete', 'equipment:maintenance',
  'reports:view',
  'users:view', 'users:create', 'users:edit', 'users:delete',
  'settings:view', 'settings:edit',
  'notifications:view', 'notifications:create',
  'profile:view', 'profile:update',
  'audit-logs:view',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const rolePermissions: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(ALL_PERMISSIONS),
  ADMIN: new Set(ALL_PERMISSIONS.filter((p) => p !== 'users:delete' && p !== 'settings:edit')),
  RECEPTIONIST: new Set<Permission>([
    'dashboard:view',
    'members:view', 'members:create', 'members:edit',
    'memberships:view', 'memberships:create',
    'membership-plans:view',
    'attendance:view', 'attendance:mark',
    'payments:view', 'payments:record',
    'trainers:view',
    'leads:view', 'leads:create', 'leads:edit',
    'inventory:view',
    'notifications:view', 'notifications:create',
    'profile:view', 'profile:update',
  ]),
  TRAINER: new Set<Permission>([
    'dashboard:view',
    'members:view',
    'memberships:view',
    'attendance:view', 'attendance:mark',
    'trainers:view',
    'notifications:view',
    'profile:view', 'profile:update',
  ]),
};

export function hasPermission(role: Role, perm: Permission): boolean {
  return rolePermissions[role]?.has(perm) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return [...(rolePermissions[role] ?? [])];
}
