import { Session } from 'next-auth';

/**
 * Check if user has a specific permission using session data
 */
export function hasPermissionInSession(
  session: Session | null,
  permission: string,
  resourceType?: string,
  resourceId?: string
): boolean {
  if (!session?.user?.permissions) {
    return false;
  }

  return session.user.permissions.some((p) => {
    // Check permission name matches
    if (p.name !== permission) {
      return false;
    }

    // If no resource specified, check for global permission
    if (!resourceType && !resourceId) {
      return !p.resourceType && !p.resourceId;
    }

    // If resource specified, check for exact match or global permission
    return (
      (!p.resourceType && !p.resourceId) || // Global permission
      (p.resourceType === resourceType && p.resourceId === resourceId) // Resource-specific permission
    );
  });
}

/**
 * Check if user has a specific role using session data
 */
export function hasRoleInSession(
  session: Session | null,
  roleName: string,
  resourceType?: string,
  resourceId?: string
): boolean {
  if (!session?.user?.roles) {
    return false;
  }

  return session.user.roles.some((r) => {
    // Check role name matches
    if (r.name !== roleName) {
      return false;
    }

    // If no resource specified, check for global role
    if (!resourceType && !resourceId) {
      return !r.resourceType && !r.resourceId;
    }

    // If resource specified, check for exact match or global role
    return (
      (!r.resourceType && !r.resourceId) || // Global role
      (r.resourceType === resourceType && r.resourceId === resourceId) // Resource-specific role
    );
  });
}

/**
 * Get all permissions for a user from session
 */
export function getSessionPermissions(session: Session | null): string[] {
  if (!session?.user?.permissions) {
    return [];
  }

  return session.user.permissions.map((p) => p.name);
}

/**
 * Get all roles for a user from session
 */
export function getSessionRoles(session: Session | null): string[] {
  if (!session?.user?.roles) {
    return [];
  }

  return session.user.roles.map((r) => r.name);
}

/**
 * Check multiple permissions at once using session data
 */
export function hasAnyPermissionInSession(
  session: Session | null,
  permissions: string[]
): boolean {
  return permissions.some((permission) =>
    hasPermissionInSession(session, permission)
  );
}

/**
 * Check if user has all specified permissions using session data
 */
export function hasAllPermissionsInSession(
  session: Session | null,
  permissions: string[]
): boolean {
  return permissions.every((permission) =>
    hasPermissionInSession(session, permission)
  );
}
