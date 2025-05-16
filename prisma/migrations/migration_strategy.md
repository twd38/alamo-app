# Migration Strategy for Multi-Board Implementation

## Overview
This document outlines the migration strategy for transitioning from a single board system to a multi-board system. The changes include:

1. Creating a new `Board` model
2. Updating `Task`, `TaskTag`, and `KanbanSection` to be associated with specific boards
3. Removing the relation between `Job` and `KanbanSection`

## Migration Steps

### 1. Apply Schema Changes
Run the Prisma migration to update the database schema:

```bash
npx prisma migrate dev --name add-multi-board-support
```

### 2. Create Default Board
After the schema migration, we need to create a default board and associate all existing tasks, tags, and sections with it:

```typescript
// migration-script.ts
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    // Find an admin user to be the default board creator
    const adminUser = await prisma.user.findFirst();
    
    if (!adminUser) {
      throw new Error('No user found to assign as board creator');
    }

    // Create a default board
    const defaultBoard = await prisma.board.create({
      data: {
        name: 'Main Board',
        createdById: adminUser.id,
        private: false,
      },
    });

    console.log(`Created default board with ID: ${defaultBoard.id}`);

    // Update all kanban sections to belong to the default board
    const updatedSections = await prisma.kanbanSection.updateMany({
      where: {
        boardId: null,
      },
      data: {
        boardId: defaultBoard.id,
      },
    });

    console.log(`Updated ${updatedSections.count} kanban sections`);

    // Update all task tags to belong to the default board
    const updatedTags = await prisma.taskTag.updateMany({
      where: {
        boardId: null,
      },
      data: {
        boardId: defaultBoard.id,
      },
    });

    console.log(`Updated ${updatedTags.count} task tags`);

    // Update all tasks to belong to the default board
    const updatedTasks = await prisma.task.updateMany({
      where: {
        boardId: null,
      },
      data: {
        boardId: defaultBoard.id,
      },
    });

    console.log(`Updated ${updatedTasks.count} tasks`);

    // Update all board views to belong to the default board
    const updatedViews = await prisma.boardView.updateMany({
      where: {
        boardId: null,
      },
      data: {
        boardId: defaultBoard.id,
      },
    });

    console.log(`Updated ${updatedViews.count} board views`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### 3. Run Migration Script
Execute the migration script:

```bash
npx ts-node migration-script.ts
```

### 4. Verify Migration
After migration, verify that:
- All tasks are associated with the default board
- All kanban sections are associated with the default board
- All task tags are associated with the default board
- All board views are associated with the default board
- Jobs are no longer associated with kanban sections

### 5. Update Frontend Code
Update frontend code to handle the multi-board system:
- Add board selection UI
- Modify task, section, and tag creation to associate with the selected board
- Update filtering logic to show only items from the selected board

## Rollback Plan
If issues are encountered:

1. Revert the schema changes:
```bash
npx prisma migrate down
```

2. Revert any frontend code changes that depend on the multi-board functionality. 