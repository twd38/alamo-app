'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import {
  requirePermission,
  PERMISSIONS,
  ROLES,
  hasPermission as serverHasPermission,
  canAccessResource as serverCanAccessResource
} from '@/lib/rbac';
import { auth } from '@/lib/auth';

/**
 * Check if current user has a specific permission (client-safe)
 */
export async function checkUserPermission(permission: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, hasPermission: false };
    }

    const hasAccess = await serverHasPermission(session.user.id, permission);
    return { success: true, hasPermission: hasAccess };
  } catch (error) {
    console.error('Error checking permission:', error);
    return {
      success: false,
      hasPermission: false,
      error: 'Failed to check permission'
    };
  }
}

/**
 * Check if current user can access a specific resource (client-safe)
 */
export async function checkResourceAccess(
  permission: string,
  resourceType: string,
  resourceId: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, hasPermission: false };
    }

    const hasAccess = await serverCanAccessResource(
      session.user.id,
      permission,
      resourceType,
      resourceId
    );
    return { success: true, hasPermission: hasAccess };
  } catch (error) {
    console.error('Error checking resource access:', error);
    return {
      success: false,
      hasPermission: false,
      error: 'Failed to check resource access'
    };
  }
}

/**
 * Get all roles
 */
export async function getAllRoles() {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT);

    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: roles };
  } catch (error) {
    console.error('Error fetching roles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch roles'
    };
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions() {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT);

    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return { success: true, data: permissions };
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch permissions'
    };
  }
}

/**
 * Assign a role to a user (global role)
 */
export async function assignUserRole(targetUserId: string, roleName: string) {
  try {
    const actorUserId = await requirePermission(
      PERMISSIONS.SYSTEM.ROLE_MANAGEMENT
    );

    // Get the role
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    // Check if user already has this role
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: targetUserId,
        roleId: role.id,
        resourceType: null,
        resourceId: null
      }
    });

    if (existingRole) {
      return { success: false, error: 'User already has this role' };
    }

    // Create user role assignment
    await prisma.userRole.create({
      data: {
        userId: targetUserId,
        roleId: role.id,
        assignedBy: actorUserId
      }
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error assigning role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign role'
    };
  }
}

/**
 * Remove a role from a user
 */
export async function removeUserRole(
  targetUserId: string,
  roleName: string,
  resourceType?: string,
  resourceId?: string
) {
  try {
    const actorUserId = await requirePermission(
      PERMISSIONS.SYSTEM.ROLE_MANAGEMENT
    );

    // Get the role
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    // Remove user role assignment
    await prisma.userRole.deleteMany({
      where: {
        userId: targetUserId,
        roleId: role.id,
        resourceType: resourceType || null,
        resourceId: resourceId || null
      }
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error('Error removing role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove role'
    };
  }
}

/**
 * Assign a resource-specific role (e.g., board collaborator)
 */
export async function assignResourceRole(
  targetUserId: string,
  roleName: string,
  resourceType: string,
  resourceId: string
) {
  try {
    // For board collaborators, check board management permission
    if (resourceType === 'board') {
      await requirePermission(
        PERMISSIONS.BOARDS.MANAGE_COLLABORATORS,
        resourceType,
        resourceId
      );
    } else {
      await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT);
    }

    const actorUserId = await requirePermission(
      PERMISSIONS.SYSTEM.ROLE_MANAGEMENT
    );

    // Get the role
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return { success: false, error: 'Role not found' };
    }

    // Check if user already has this role for this resource
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: targetUserId,
        roleId: role.id,
        resourceType,
        resourceId
      }
    });

    if (existingRole) {
      return {
        success: false,
        error: 'User already has this role for this resource'
      };
    }

    // Create user role assignment
    await prisma.userRole.create({
      data: {
        userId: targetUserId,
        roleId: role.id,
        resourceType,
        resourceId,
        assignedBy: actorUserId
      }
    });

    revalidatePath(`/${resourceType}/${resourceId}`);
    return { success: true };
  } catch (error) {
    console.error('Error assigning resource role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign role'
    };
  }
}

/**
 * Get all users with their roles
 */
export async function getUsersWithRoles() {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT);

    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users with roles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    };
  }
}

/**
 * Get user's permissions for a specific resource
 */
export async function getUserResourcePermissions(
  userId: string,
  resourceType: string,
  resourceId: string
) {
  try {
    // Users can view their own permissions, or admins can view any user's permissions
    const session = await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT);
    if (session !== userId) {
      await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT);
    }

    // Get user's roles for this resource
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        OR: [
          { resourceType: null, resourceId: null }, // Global roles
          { resourceType, resourceId } // Resource-specific roles
        ]
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Get direct permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        OR: [
          { resourceType: null, resourceId: null }, // Global permissions
          { resourceType, resourceId } // Resource-specific permissions
        ]
      },
      include: {
        permission: true
      }
    });

    const rolePermissions = userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => ({
        permission: rp.permission.name,
        source: `Role: ${ur.role.name}`,
        resourceSpecific: !!ur.resourceType
      }))
    );

    const directPermissions = userPermissions.map((up) => ({
      permission: up.permission.name,
      source: 'Direct assignment',
      granted: up.granted,
      resourceSpecific: !!up.resourceType
    }));

    return {
      success: true,
      data: {
        rolePermissions,
        directPermissions,
        roles: userRoles.map((ur) => ur.role)
      }
    };
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch permissions'
    };
  }
}

/**
 * Initialize default admin user (should be run once during setup)
 */
export async function initializeAdminUser(userEmail: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get super admin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: ROLES.SUPER_ADMIN }
    });

    if (!superAdminRole) {
      return { success: false, error: 'Super admin role not found' };
    }

    // Check if user already has super admin role
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: superAdminRole.id
      }
    });

    if (existingRole) {
      return { success: true, message: 'User is already a super admin' };
    }

    // Assign super admin role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
        assignedBy: user.id // Self-assigned for initial setup
      }
    });

    console.log(`✅ Granted super admin role to ${userEmail}`);
    return { success: true, message: 'Super admin role assigned successfully' };
  } catch (error) {
    console.error('Error initializing admin user:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to initialize admin user'
    };
  }
}
