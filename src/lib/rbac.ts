import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Permission constants organized by resource
export const PERMISSIONS = {
  // Global system permissions
  SYSTEM: {
    ADMIN: 'system:admin',
    USER_MANAGEMENT: 'system:user_management',
    ROLE_MANAGEMENT: 'system:role_management',
  },
  
  // Board permissions
  BOARDS: {
    CREATE: 'boards:create',
    READ: 'boards:read',
    UPDATE: 'boards:update',
    DELETE: 'boards:delete',
    MANAGE_COLLABORATORS: 'boards:manage_collaborators',
  },
  
  // Task permissions
  TASKS: {
    CREATE: 'tasks:create',
    READ: 'tasks:read',
    UPDATE: 'tasks:update',
    DELETE: 'tasks:delete',
    ASSIGN: 'tasks:assign',
    CHANGE_STATUS: 'tasks:change_status',
  },
  
  // Work Order permissions
  WORK_ORDERS: {
    CREATE: 'work_orders:create',
    READ: 'work_orders:read',
    UPDATE: 'work_orders:update',
    DELETE: 'work_orders:delete',
    ASSIGN: 'work_orders:assign',
    START: 'work_orders:start',
    COMPLETE: 'work_orders:complete',
    CLOCK_IN: 'work_orders:clock_in',
  },
  
  // Parts permissions
  PARTS: {
    CREATE: 'parts:create',
    READ: 'parts:read',
    UPDATE: 'parts:update',
    DELETE: 'parts:delete',
    MANAGE_BOM: 'parts:manage_bom',
    MANAGE_INVENTORY: 'parts:manage_inventory',
  },
  
  // Work Instructions permissions
  WORK_INSTRUCTIONS: {
    CREATE: 'work_instructions:create',
    READ: 'work_instructions:read',
    UPDATE: 'work_instructions:update',
    DELETE: 'work_instructions:delete',
    APPROVE: 'work_instructions:approve',
    EXECUTE: 'work_instructions:execute',
  },
  
  // Inventory permissions
  INVENTORY: {
    READ: 'inventory:read',
    UPDATE: 'inventory:update',
    MOVE: 'inventory:move',
    ADJUST: 'inventory:adjust',
    RECEIVE: 'inventory:receive',
    SHIP: 'inventory:ship',
  },
  
  // Order permissions
  ORDERS: {
    CREATE: 'orders:create',
    READ: 'orders:read',
    UPDATE: 'orders:update',
    DELETE: 'orders:delete',
    PROCESS: 'orders:process',
  },
} as const

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  PRODUCTION_SUPERVISOR: 'production_supervisor',
  OPERATOR: 'operator',
  QUALITY_INSPECTOR: 'quality_inspector',
  INVENTORY_CLERK: 'inventory_clerk',
  VIEWER: 'viewer',
  BOARD_COLLABORATOR: 'board_collaborator',
} as const

// Flatten permissions for easier access
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).reduce((acc, category) => {
  return { ...acc, ...category }
}, {})

/**
 * Check if a user has a specific permission
 * Supports both global and resource-specific permissions
 */
export async function hasPermission(
  userId: string,
  permission: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  // Check direct user permissions first
  const userPermission = await prisma.userPermission.findFirst({
    where: {
      userId,
      permission: { name: permission },
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      granted: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: { permission: true }
  })

  if (userPermission) return true

  // Check for deny permissions (these override role permissions)
  const denyPermission = await prisma.userPermission.findFirst({
    where: {
      userId,
      permission: { name: permission },
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      granted: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  })

  if (denyPermission) return false

  // Check role-based permissions
  const rolePermissions = await prisma.userRole.findMany({
    where: {
      userId,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      }
    }
  })

  return rolePermissions.some((userRole: any) =>
    userRole.role.rolePermissions.some((rp: any) => rp.permission.name === permission)
  )
}

/**
 * Check if current authenticated user has permission
 */
export async function currentUserHasPermission(
  permission: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false
  
  return hasPermission(session.user.id, permission, resourceType, resourceId)
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  userId: string,
  resourceType?: string,
  resourceId?: string
): Promise<string[]> {
  // Get direct permissions
  const userPermissions = await prisma.userPermission.findMany({
    where: {
      userId,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      granted: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: { permission: true }
  })

  // Get role-based permissions
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      }
    }
  })

  const rolePermissions = userRoles.flatMap((ur: any) =>
    ur.role.rolePermissions.map((rp: any) => rp.permission.name)
  )

  const directPermissions = userPermissions.map((up: any) => up.permission.name)

  // Get deny permissions to filter out
  const denyPermissions = await prisma.userPermission.findMany({
    where: {
      userId,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      granted: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: { permission: true }
  })

  const deniedPermissionNames = new Set(denyPermissions.map((dp: any) => dp.permission.name))

  // Combine and deduplicate, filtering out denied permissions
  const uniquePermissions = Array.from(new Set([...directPermissions, ...rolePermissions]))
  return uniquePermissions.filter(permission => !deniedPermissionNames.has(permission))
}

/**
 * Assign a role to a user
 */
export async function assignRole(
  userId: string,
  roleId: string,
  assignedBy: string,
  resourceType?: string,
  resourceId?: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
        resourceType,
        resourceId,
        expiresAt
      }
    })
    return true
  } catch (error) {
    console.error('Error assigning role:', error)
    return false
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(
  userId: string,
  roleId: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  try {
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
        resourceType: resourceType || null,
        resourceId: resourceId || null
      }
    })
    return true
  } catch (error) {
    console.error('Error removing role:', error)
    return false
  }
}

/**
 * Grant a permission directly to a user
 */
export async function grantPermission(
  userId: string,
  permissionId: string,
  assignedBy: string,
  resourceType?: string,
  resourceId?: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    // Use a different approach since the unique constraint includes nullable fields
    const existingPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId,
        resourceType: resourceType || null,
        resourceId: resourceId || null
      }
    })

    if (existingPermission) {
      await prisma.userPermission.update({
        where: { id: existingPermission.id },
        data: {
          granted: true,
          assignedBy,
          assignedAt: new Date(),
          expiresAt
        }
      })
    } else {
      await prisma.userPermission.create({
        data: {
          userId,
          permissionId,
          assignedBy,
          resourceType,
          resourceId,
          granted: true,
          expiresAt
        }
      })
    }
    return true
  } catch (error) {
    console.error('Error granting permission:', error)
    return false
  }
}

/**
 * Deny a permission for a user (override role permissions)
 */
export async function denyPermission(
  userId: string,
  permissionId: string,
  assignedBy: string,
  resourceType?: string,
  resourceId?: string,
  expiresAt?: Date
): Promise<boolean> {
  try {
    // Use a different approach since the unique constraint includes nullable fields
    const existingPermission = await prisma.userPermission.findFirst({
      where: {
        userId,
        permissionId,
        resourceType: resourceType || null,
        resourceId: resourceId || null
      }
    })

    if (existingPermission) {
      await prisma.userPermission.update({
        where: { id: existingPermission.id },
        data: {
          granted: false,
          assignedBy,
          assignedAt: new Date(),
          expiresAt
        }
      })
    } else {
      await prisma.userPermission.create({
        data: {
          userId,
          permissionId,
          assignedBy,
          resourceType,
          resourceId,
          granted: false,
          expiresAt
        }
      })
    }
    return true
  } catch (error) {
    console.error('Error denying permission:', error)
    return false
  }
}

/**
 * Check if user owns a resource (for ownership-based permissions)
 */
export async function isResourceOwner(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'board':
      const board = await prisma.board.findFirst({
        where: { id: resourceId, createdById: userId }
      })
      return !!board

    case 'task':
      const task = await prisma.task.findFirst({
        where: { id: resourceId, createdById: userId }
      })
      return !!task

    case 'work_order':
      const workOrder = await prisma.workOrder.findFirst({
        where: { id: resourceId, createdById: userId }
      })
      return !!workOrder

    case 'work_instruction':
      const workInstruction = await prisma.workInstruction.findFirst({
        where: { id: resourceId, createdById: userId }
      })
      return !!workInstruction

    default:
      return false
  }
}

/**
 * Check if user is a collaborator on a resource
 */
export async function isResourceCollaborator(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'board':
      const board = await prisma.board.findFirst({
        where: {
          id: resourceId,
          collaborators: { some: { id: userId } }
        }
      })
      return !!board

    case 'work_order':
      const workOrder = await prisma.workOrder.findFirst({
        where: {
          id: resourceId,
          assignees: { some: { userId } }
        }
      })
      return !!workOrder

    case 'task':
      const task = await prisma.task.findFirst({
        where: {
          id: resourceId,
          assignees: { some: { id: userId } }
        }
      })
      return !!task

    default:
      return false
  }
}

/**
 * Enhanced permission check that includes ownership and collaboration
 */
export async function canAccessResource(
  userId: string,
  permission: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Check explicit permission first
  if (await hasPermission(userId, permission, resourceType, resourceId)) {
    return true
  }

  // Check global permission
  if (await hasPermission(userId, permission)) {
    return true
  }

  // Check ownership-based access
  if (await isResourceOwner(userId, resourceType, resourceId)) {
    // Owners typically have read/update permissions
    if (permission.includes(':read') || permission.includes(':update')) {
      return true
    }
  }

  // Check collaboration-based access
  if (await isResourceCollaborator(userId, resourceType, resourceId)) {
    // Collaborators typically have read permissions
    if (permission.includes(':read')) {
      return true
    }
  }

  return false
}

/**
 * Middleware function to check permissions in server actions
 */
export async function requirePermission(
  permission: string,
  resourceType?: string,
  resourceId?: string
): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  const hasAccess = resourceType && resourceId
    ? await canAccessResource(session.user.id, permission, resourceType, resourceId)
    : await hasPermission(session.user.id, permission)

  if (!hasAccess) {
    throw new Error('Insufficient permissions')
  }

  return session.user.id
} 