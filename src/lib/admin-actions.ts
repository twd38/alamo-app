'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/rbac'

/**
 * Create a new user
 */
export async function createUser(userData: {
  name: string
  email: string
  image?: string | null
}) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT)
    
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })
    
    if (existingUser) {
      return { success: false, error: 'A user with this email already exists' }
    }
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        image: userData.image,
      }
    })
    
    revalidatePath('/admin')
    return { success: true, data: user }
  } catch (error) {
    console.error('Error creating user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    }
  }
}

/**
 * Update an existing user
 */
export async function updateUser(userId: string, userData: {
  name: string
  image?: string | null
}) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT)
    
    // Update the user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: userData.name,
        image: userData.image,
      }
    })
    
    revalidatePath('/admin')
    return { success: true, data: user }
  } catch (error) {
    console.error('Error updating user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user' 
    }
  }
}

/**
 * Deletes a user (only for admins)
 */
export async function deleteUser(userId: string) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin permission
    const hasAdminPermission = await hasPermission(session.user.id, PERMISSIONS.SYSTEM.ADMIN);
    if (!hasAdminPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Prevent deleting yourself
    if (session.user.id === userId) {
      return { success: false, error: "Cannot delete your own account" };
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

/**
 * Get all roles
 */
export async function getAllRoles() {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT)
    
    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    return { success: true, data: roles }
  } catch (error) {
    console.error('Error fetching roles:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch roles' 
    }
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions() {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT)
    
    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    return { success: true, data: permissions }
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch permissions' 
    }
  }
}

/**
 * Create a new role
 */
export async function createRole(roleData: {
  name: string
  description?: string | null
}) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT)
    
    // Check if role with this name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name }
    })
    
    if (existingRole) {
      return { success: false, error: 'A role with this name already exists' }
    }
    
    // Create the role
    const role = await prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
      }
    })
    
    revalidatePath('/admin')
    return { success: true, data: role }
  } catch (error) {
    console.error('Error creating role:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create role' 
    }
  }
}

/**
 * Update an existing role
 */
export async function updateRole(roleId: string, roleData: {
  name: string
  description?: string | null
}) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT)
    
    // Update the role
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: roleData.name,
        description: roleData.description,
      }
    })
    
    revalidatePath('/admin')
    return { success: true, data: role }
  } catch (error) {
    console.error('Error updating role:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update role' 
    }
  }
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT)
    
    // Check if role is assigned to any users
    const userRoles = await prisma.userRole.findMany({
      where: { roleId }
    })
    
    if (userRoles.length > 0) {
      return { 
        success: false, 
        error: 'Cannot delete role that is assigned to users. Remove all user assignments first.' 
      }
    }
    
    // Delete the role
    await prisma.role.delete({
      where: { id: roleId }
    })
    
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error deleting role:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete role' 
    }
  }
}

/**
 * Creates a new access badge for a user
 */
export async function createAccessBadge(userId: string) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin permission
    const hasAdminPermission = await hasPermission(session.user.id, PERMISSIONS.SYSTEM.ADMIN);
    if (!hasAdminPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if user already has a badge
    const existingBadge = await prisma.accessBadge.findUnique({
      where: { userId }
    });

    if (existingBadge) {
      return { success: false, error: "User already has an access badge" };
    }

    // Create the badge
    const badge = await prisma.accessBadge.create({
      data: {
        userId,
        createdById: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return { success: true, data: badge };
  } catch (error) {
    console.error("Create access badge error:", error);
    return { success: false, error: "Failed to create access badge" };
  }
}

/**
 * Deletes an access badge
 */
export async function deleteAccessBadge(badgeId: string) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has admin permission
    const hasAdminPermission = await hasPermission(session.user.id, PERMISSIONS.SYSTEM.ADMIN);
    if (!hasAdminPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Delete the badge
    await prisma.accessBadge.delete({
      where: { id: badgeId }
    });

    return { success: true };
  } catch (error) {
    console.error("Delete access badge error:", error);
    return { success: false, error: "Failed to delete access badge" };
  }
} 