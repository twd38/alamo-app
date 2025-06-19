'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { requirePermission, PERMISSIONS } from '@/lib/rbac'

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
 * Delete a user (soft delete by setting a flag or hard delete)
 */
export async function deleteUser(userId: string) {
  try {
    await requirePermission(PERMISSIONS.SYSTEM.USER_MANAGEMENT)
    
    // For safety, we could implement soft delete or add additional checks
    // For now, we'll do a hard delete but you might want to modify this
    await prisma.user.delete({
      where: { id: userId }
    })
    
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    }
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