# Role-Based Access Control (RBAC) Implementation Guide

## Overview

We've implemented a comprehensive Role-Based Access Control (RBAC) system for the Alamo application. This system provides:

- **Granular Permissions**: Fine-grained control over what users can do
- **Flexible Roles**: Pre-defined roles with specific permission sets
- **Resource-Specific Access**: Permissions can be global or tied to specific resources
- **Ownership & Collaboration**: Automatic access based on resource ownership and collaboration
- **Audit Trail**: Track who assigned roles and when

## Database Schema

The RBAC system adds the following tables:

### Core Tables
- `Role`: Defines roles (e.g., admin, operator, manager)
- `Permission`: Defines specific permissions (e.g., "boards:create", "work_orders:read")
- `UserRole`: Assigns roles to users (globally or for specific resources)
- `UserPermission`: Grants/denies specific permissions to users
- `RolePermission`: Maps which permissions each role has

### Key Features
- **Global vs Resource-Specific**: Roles and permissions can be assigned globally or for specific resources
- **Permission Hierarchy**: Role permissions + direct permissions + ownership/collaboration rules
- **Temporal Controls**: Roles and permissions can have expiration dates
- **Audit Fields**: Track who assigned what and when

## Built-in Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `super_admin` | Complete system access | All permissions |
| `admin` | Administrative access | User management, most resources |
| `manager` | Management oversight | Boards, tasks, work orders, basic parts |
| `production_supervisor` | Production management | Work orders, work instructions, inventory |
| `operator` | Production worker | Execute work instructions, clock in/out |
| `quality_inspector` | Quality control | Approve work instructions, inspect work |
| `inventory_clerk` | Inventory management | Parts, inventory, orders |
| `viewer` | Read-only access | View most resources |
| `board_collaborator` | Board collaboration | Board-specific collaboration rights |

## Permission Structure

Permissions follow the format `resource:action`. Examples:

### System Permissions
- `system:admin` - Full system administration
- `system:user_management` - Manage users
- `system:role_management` - Manage roles and permissions

### Resource Permissions
- `boards:create`, `boards:read`, `boards:update`, `boards:delete`
- `work_orders:create`, `work_orders:start`, `work_orders:complete`
- `parts:create`, `parts:manage_inventory`
- `work_instructions:approve`, `work_instructions:execute`

## Usage Examples

### 1. Basic Permission Checking

```typescript
import { currentUserHasPermission, PERMISSIONS } from '@/lib/rbac'

// Check if current user can create work orders
const canCreate = await currentUserHasPermission(PERMISSIONS.WORK_ORDERS.CREATE)

if (canCreate) {
  // Show create button
}
```

### 2. Resource-Specific Permission Checking

```typescript
import { canAccessResource, PERMISSIONS } from '@/lib/rbac'

// Check if user can update a specific board
const canEdit = await canAccessResource(
  userId, 
  PERMISSIONS.BOARDS.UPDATE, 
  'board', 
  boardId
)
```

### 3. Server Action Integration

```typescript
import { requirePermission, PERMISSIONS } from '@/lib/rbac'

export async function createWorkOrder(data: WorkOrderData) {
  try {
    // This will throw if user doesn't have permission
    const userId = await requirePermission(PERMISSIONS.WORK_ORDERS.CREATE)
    
    // Continue with work order creation...
  } catch (error) {
    return { success: false, error: 'Insufficient permissions' }
  }
}
```

### 4. Managing User Roles

```typescript
import { assignUserRole, removeUserRole, ROLES } from '@/lib/rbac-actions'

// Assign a global role to a user
await assignUserRole(userId, ROLES.OPERATOR)

// Assign a resource-specific role
await assignResourceRole(userId, ROLES.BOARD_COLLABORATOR, 'board', boardId)

// Remove a role
await removeUserRole(userId, ROLES.OPERATOR)
```

## Access Control Hierarchy

The system checks permissions in this order:

1. **Direct Deny Permissions**: Explicit deny overrides everything
2. **Direct Grant Permissions**: Explicit grants for the user
3. **Role Permissions**: Permissions from assigned roles
4. **Ownership**: Resource owners get read/update access
5. **Collaboration**: Collaborators get read access

## Setup Instructions

### 1. Run the Migration
The RBAC tables are already created via the migration:
```bash
npx prisma migrate dev --name rbac_system
```

### 2. Seed the System
Populate roles and permissions:
```bash
npx tsx scripts/seed-rbac.ts
```

### 3. Initialize Admin User
Grant super admin role to the first user:
```bash
npx tsx scripts/init-admin.ts your-email@example.com
```

## Integration Checklist

To integrate RBAC into existing actions:

### ✅ Server Actions
Replace manual auth checks:

**Before:**
```typescript
const session = await auth()
const userId = session?.user?.id

if (!userId) {
  return { success: false, error: 'Not authenticated' }
}
```

**After:**
```typescript
import { requirePermission, PERMISSIONS } from '@/lib/rbac'

const userId = await requirePermission(PERMISSIONS.WORK_ORDERS.CREATE)
```

### ✅ Component Visibility
Hide/show UI elements based on permissions:

```typescript
import { currentUserHasPermission, PERMISSIONS } from '@/lib/rbac'

export async function WorkOrderHeader() {
  const canCreate = await currentUserHasPermission(PERMISSIONS.WORK_ORDERS.CREATE)
  
  return (
    <div>
      {canCreate && <CreateWorkOrderButton />}
    </div>
  )
}
```

### ✅ Resource-Specific Checks
For resources with ownership/collaboration:

```typescript
import { canAccessResource, PERMISSIONS } from '@/lib/rbac'

const canEdit = await canAccessResource(
  userId,
  PERMISSIONS.BOARDS.UPDATE,
  'board',
  boardId
)
```

## Advanced Features

### Temporary Permissions
Grant time-limited access:

```typescript
import { grantPermission } from '@/lib/rbac'

await grantPermission(
  userId,
  permissionId,
  assignedBy,
  resourceType,
  resourceId,
  new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
)
```

### Permission Auditing
Track who has what permissions:

```typescript
import { getUserResourcePermissions } from '@/lib/rbac-actions'

const permissions = await getUserResourcePermissions(userId, 'board', boardId)
// Returns: { rolePermissions, directPermissions, roles }
```

### Custom Permission Checks
For complex business logic:

```typescript
import { hasPermission, isResourceOwner } from '@/lib/rbac'

const canApprove = await hasPermission(userId, PERMISSIONS.WORK_INSTRUCTIONS.APPROVE) ||
  (await isResourceOwner(userId, 'work_instruction', instructionId) && 
   await hasPermission(userId, PERMISSIONS.WORK_INSTRUCTIONS.UPDATE))
```

## Security Best Practices

1. **Principle of Least Privilege**: Start with minimal permissions
2. **Regular Audits**: Review user permissions periodically
3. **Resource Isolation**: Use resource-specific permissions when possible
4. **Temporary Access**: Use expiration dates for temporary permissions
5. **Audit Logging**: Track permission changes and access attempts

## Testing RBAC

### Unit Tests
Test permission checking logic:

```typescript
import { hasPermission } from '@/lib/rbac'

test('operator can start work orders', async () => {
  const canStart = await hasPermission(operatorUserId, PERMISSIONS.WORK_ORDERS.START)
  expect(canStart).toBe(true)
})
```

### Integration Tests
Test complete workflows:

```typescript
test('operator workflow', async () => {
  // Assign operator role
  await assignUserRole(userId, ROLES.OPERATOR)
  
  // Test work order operations
  const result = await startWorkOrder(workOrderId)
  expect(result.success).toBe(true)
})
```

## Migration from Existing Code

The system is backward compatible. Existing ownership checks will continue to work alongside RBAC. You can migrate incrementally:

1. Start with high-value functions (admin operations)
2. Add RBAC to new features
3. Gradually replace manual checks in existing code
4. Test thoroughly at each step

## Troubleshooting

### Common Issues

**"Insufficient permissions" errors:**
- Check if user has the required role
- Verify role has the required permission
- Check for deny permissions overriding grants

**Resource-specific access not working:**
- Ensure resource type/ID are correct
- Verify ownership/collaboration relationships
- Check both global and resource-specific permissions

**Performance concerns:**
- RBAC checks are optimized with proper indexing
- Consider caching for frequently-checked permissions
- Use bulk permission checks when possible

### Debug Commands

```typescript
// Get all user permissions
const permissions = await getUserPermissions(userId)

// Check specific permission with details
const hasAccess = await canAccessResource(userId, permission, resourceType, resourceId)

// Get user's roles
const roles = await prisma.userRole.findMany({ where: { userId } })
```

This RBAC system provides enterprise-grade access control while remaining flexible and easy to use. Start with the built-in roles and gradually customize as your needs evolve. 