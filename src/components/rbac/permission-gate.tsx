import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { hasPermissionInSession } from '@/lib/session-permissions'

interface PermissionGateProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  resourceType?: string
  resourceId?: string
}

/**
 * Component that conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGate permission={PERMISSIONS.WORK_ORDERS.CREATE}>
 *   <CreateWorkOrderButton />
 * </PermissionGate>
 * 
 * <PermissionGate 
 *   permission={PERMISSIONS.BOARDS.UPDATE} 
 *   resourceType="board" 
 *   resourceId={boardId}
 *   fallback={<div>You don't have permission to edit this board</div>}
 * >
 *   <EditBoardForm />
 * </PermissionGate>
 */
export function PermissionGate({ 
  permission, 
  children, 
  fallback = null,
  resourceType,
  resourceId 
}: PermissionGateProps) {
  const { data: session, status } = useSession()
  
  // Check permission using session data
  const hasAccess = hasPermissionInSession(session, permission, resourceType, resourceId)
  const loading = status === 'loading'

  if (loading) {
    return null // or a loading spinner
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook-based permission check for use in components
 */
export function usePermissionGate(
  permission: string,
  resourceType?: string,
  resourceId?: string
) {
  const { data: session, status } = useSession()
  
  const hasAccess = hasPermissionInSession(session, permission, resourceType, resourceId)
  const loading = status === 'loading'
  
  return { hasAccess, loading }
} 