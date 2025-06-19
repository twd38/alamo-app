#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { PERMISSIONS, ROLES } from '../src/lib/rbac'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding RBAC system...')
  console.log(`📡 Using database: ${process.env.DATABASE_URL?.substring(0, 50)}...`)

  // Create all permissions
  console.log('📋 Creating permissions...')
  const permissionData = []

  // Flatten permissions and extract resource and action
  for (const [category, perms] of Object.entries(PERMISSIONS)) {
    for (const [action, permission] of Object.entries(perms)) {
      const [resource, actionName] = permission.split(':')
      permissionData.push({
        name: permission,
        resource,
        action: actionName,
        description: `${action.replace(/_/g, ' ')} permission for ${category.toLowerCase().replace(/_/g, ' ')}`
      })
    }
  }

  // Create permissions
  for (const permission of permissionData) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission
    })
  }

  console.log(`✅ Created ${permissionData.length} permissions`)

  // Create roles
  console.log('👥 Creating roles...')
  const roleDefinitions = [
    {
      name: ROLES.SUPER_ADMIN,
      description: 'Complete system access - can manage everything',
      isSystemRole: true
    },
    {
      name: ROLES.ADMIN,
      description: 'Administrative access - can manage users and most resources',
      isSystemRole: true
    },
    {
      name: ROLES.MANAGER,
      description: 'Management access - can oversee projects and work orders',
      isSystemRole: true
    },
    {
      name: ROLES.PRODUCTION_SUPERVISOR,
      description: 'Production supervision - can manage work orders and production',
      isSystemRole: true
    },
    {
      name: ROLES.OPERATOR,
      description: 'Production operator - can execute work instructions and clock in/out',
      isSystemRole: true
    },
    {
      name: ROLES.QUALITY_INSPECTOR,
      description: 'Quality control - can approve work instructions and inspect work',
      isSystemRole: true
    },
    {
      name: ROLES.INVENTORY_CLERK,
      description: 'Inventory management - can manage parts and inventory',
      isSystemRole: true
    },
    {
      name: ROLES.VIEWER,
      description: 'Read-only access - can view most resources but not modify',
      isSystemRole: true
    },
    {
      name: ROLES.BOARD_COLLABORATOR,
      description: 'Board collaboration - can collaborate on specific boards',
      isSystemRole: false
    }
  ]

  for (const role of roleDefinitions) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role
    })
  }

  console.log(`✅ Created ${roleDefinitions.length} roles`)

  // Define role-permission mappings
  console.log('🔗 Assigning permissions to roles...')
  
  const rolePermissions: Record<string, string[]> = {
    [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS).flatMap(category => Object.values(category)),
    
    [ROLES.ADMIN]: [
      // System permissions (except full admin)
      PERMISSIONS.SYSTEM.USER_MANAGEMENT,
      PERMISSIONS.SYSTEM.ROLE_MANAGEMENT,
      
      // Full access to boards, tasks, and orders
      ...Object.values(PERMISSIONS.BOARDS),
      ...Object.values(PERMISSIONS.TASKS),
      ...Object.values(PERMISSIONS.ORDERS),
      
      // Read/update access to production
      PERMISSIONS.WORK_ORDERS.READ,
      PERMISSIONS.WORK_ORDERS.UPDATE,
      PERMISSIONS.WORK_ORDERS.ASSIGN,
      PERMISSIONS.WORK_ORDERS.CREATE,
      
      // Parts and inventory management
      ...Object.values(PERMISSIONS.PARTS),
      ...Object.values(PERMISSIONS.INVENTORY),
      
      // Work instructions management
      PERMISSIONS.WORK_INSTRUCTIONS.CREATE,
      PERMISSIONS.WORK_INSTRUCTIONS.READ,
      PERMISSIONS.WORK_INSTRUCTIONS.UPDATE,
      PERMISSIONS.WORK_INSTRUCTIONS.DELETE,
      PERMISSIONS.WORK_INSTRUCTIONS.APPROVE,
    ],
    
    [ROLES.MANAGER]: [
      // Board and task management
      ...Object.values(PERMISSIONS.BOARDS),
      ...Object.values(PERMISSIONS.TASKS),
      
      // Work order management
      PERMISSIONS.WORK_ORDERS.CREATE,
      PERMISSIONS.WORK_ORDERS.READ,
      PERMISSIONS.WORK_ORDERS.UPDATE,
      PERMISSIONS.WORK_ORDERS.ASSIGN,
      
      // Parts read access
      PERMISSIONS.PARTS.READ,
      PERMISSIONS.PARTS.UPDATE,
      
      // Work instructions
      PERMISSIONS.WORK_INSTRUCTIONS.CREATE,
      PERMISSIONS.WORK_INSTRUCTIONS.READ,
      PERMISSIONS.WORK_INSTRUCTIONS.UPDATE,
      PERMISSIONS.WORK_INSTRUCTIONS.APPROVE,
      
      // Inventory read
      PERMISSIONS.INVENTORY.READ,
      
      // Orders
      ...Object.values(PERMISSIONS.ORDERS),
    ],
    
    [ROLES.PRODUCTION_SUPERVISOR]: [
      // Work order management
      ...Object.values(PERMISSIONS.WORK_ORDERS),
      
      // Work instructions
      PERMISSIONS.WORK_INSTRUCTIONS.READ,
      PERMISSIONS.WORK_INSTRUCTIONS.EXECUTE,
      PERMISSIONS.WORK_INSTRUCTIONS.APPROVE,
      
      // Parts read
      PERMISSIONS.PARTS.READ,
      
      // Inventory management
      PERMISSIONS.INVENTORY.READ,
      PERMISSIONS.INVENTORY.UPDATE,
      PERMISSIONS.INVENTORY.MOVE,
      
      // Task read/update
      PERMISSIONS.TASKS.READ,
      PERMISSIONS.TASKS.UPDATE,
      PERMISSIONS.TASKS.ASSIGN,
    ],
    
    [ROLES.OPERATOR]: [
      // Work order execution
      PERMISSIONS.WORK_ORDERS.READ,
      PERMISSIONS.WORK_ORDERS.START,
      PERMISSIONS.WORK_ORDERS.COMPLETE,
      PERMISSIONS.WORK_ORDERS.CLOCK_IN,
      
      // Work instructions execution
      PERMISSIONS.WORK_INSTRUCTIONS.READ,
      PERMISSIONS.WORK_INSTRUCTIONS.EXECUTE,
      
      // Parts read
      PERMISSIONS.PARTS.READ,
      
      // Basic inventory
      PERMISSIONS.INVENTORY.READ,
      
      // Task read
      PERMISSIONS.TASKS.READ,
    ],
    
    [ROLES.QUALITY_INSPECTOR]: [
      // Work instruction approval
      PERMISSIONS.WORK_INSTRUCTIONS.READ,
      PERMISSIONS.WORK_INSTRUCTIONS.APPROVE,
      
      // Work order read/update
      PERMISSIONS.WORK_ORDERS.READ,
      PERMISSIONS.WORK_ORDERS.UPDATE,
      
      // Parts read
      PERMISSIONS.PARTS.READ,
      
      // Inventory read
      PERMISSIONS.INVENTORY.READ,
    ],
    
    [ROLES.INVENTORY_CLERK]: [
      // Full inventory management
      ...Object.values(PERMISSIONS.INVENTORY),
      
      // Parts management
      PERMISSIONS.PARTS.CREATE,
      PERMISSIONS.PARTS.READ,
      PERMISSIONS.PARTS.UPDATE,
      PERMISSIONS.PARTS.MANAGE_INVENTORY,
      
      // Orders
      PERMISSIONS.ORDERS.READ,
      PERMISSIONS.ORDERS.UPDATE,
      PERMISSIONS.ORDERS.PROCESS,
    ],
    
    [ROLES.VIEWER]: [
      // Read-only access to most resources
      PERMISSIONS.BOARDS.READ,
      PERMISSIONS.TASKS.READ,
      PERMISSIONS.WORK_ORDERS.READ,
      PERMISSIONS.PARTS.READ,
      PERMISSIONS.WORK_INSTRUCTIONS.READ,
      PERMISSIONS.INVENTORY.READ,
      PERMISSIONS.ORDERS.READ,
    ],
    
    [ROLES.BOARD_COLLABORATOR]: [
      // Board collaboration permissions
      PERMISSIONS.BOARDS.READ,
      PERMISSIONS.TASKS.READ,
      PERMISSIONS.TASKS.UPDATE,
      PERMISSIONS.TASKS.CREATE,
    ]
  }

  // Get all roles and permissions from database
  const roles = await prisma.role.findMany()
  const permissions = await prisma.permission.findMany()

  // Create role-permission mappings
  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = roles.find(r => r.name === roleName)
    if (!role) {
      console.warn(`⚠️  Role ${roleName} not found`)
      continue
    }

    // Clear existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    })

    // Add new permissions
    for (const permissionName of permissionNames) {
      const permission = permissions.find(p => p.name === permissionName)
      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        })
      } else {
        console.warn(`⚠️  Permission ${permissionName} not found`)
      }
    }

    console.log(`✅ Assigned ${permissionNames.length} permissions to ${roleName}`)
  }

  console.log('🎉 RBAC system seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding RBAC system:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 