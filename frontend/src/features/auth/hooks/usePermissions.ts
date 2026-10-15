import { useCallback, useMemo } from 'react'
import { useAuth } from '../context/useAuth'
import { rolePermissions } from '../permissions/permissions'
import type { Permission } from '../permissions/permissions'

export function usePermissions() {
  const { user } = useAuth()
  const role = user?.role

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!role) return false
      return rolePermissions[role]?.includes(permission) ?? false
    },
    [role],
  )

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some(hasPermission)
    },
    [hasPermission],
  )

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every(hasPermission)
    },
    [hasPermission],
  )

  return useMemo(
    () => ({ hasPermission, hasAnyPermission, hasAllPermissions }),
    [hasPermission, hasAnyPermission, hasAllPermissions],
  )
}

