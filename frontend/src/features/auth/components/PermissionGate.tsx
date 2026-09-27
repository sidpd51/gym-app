import type { ReactNode } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import type { Permission } from '../permissions/permissions'

interface PermissionGateProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermissions()
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
}
