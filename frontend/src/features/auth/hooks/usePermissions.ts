import { useAuth } from '../context/useAuth'
import { rolePermissions } from '../permissions/permissions'
import type { Permission } from '../permissions/permissions'

export function usePermissions() {
  const { user } = useAuth()

  function hasPermission(permission: Permission): boolean {
    if (!user) return false
    return rolePermissions[user.role]?.includes(permission) ?? false
  }

  function hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(hasPermission)
  }

  function hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(hasPermission)
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions }
}
