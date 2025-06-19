import { useSession } from 'next-auth/react'
import { hasPermissionInSession } from '@/lib/session-permissions'

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permission: string) {
  const { data: session, status } = useSession()
  
  const hasAccess = hasPermissionInSession(session, permission)
  const loading = status === 'loading'

  return { hasAccess, loading }
}

/**
 * Hook to check if current user can access a specific resource
 */
export function useResourceAccess(
  permission: string,
  resourceType: string,
  resourceId: string
) {
  const { data: session, status } = useSession()
  
  const hasAccess = hasPermissionInSession(session, permission, resourceType, resourceId)
  const loading = status === 'loading'

  return { hasAccess, loading }
}

/**
 * Hook to check multiple permissions at once
 */
export function usePermissions(permissions: string[]) {
  const { data: session, status } = useSession()
  
  const permissionMap = permissions.reduce((map, permission) => {
    map[permission] = hasPermissionInSession(session, permission)
    return map
  }, {} as Record<string, boolean>)
  
  const loading = status === 'loading'

  return { 
    permissions: permissionMap, 
    loading,
    hasPermission: (permission: string) => permissionMap[permission] || false
  }
} 