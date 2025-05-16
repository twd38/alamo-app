/**
 * Migration script for multi-board support
 * 
 * IMPORTANT: This script should be run AFTER applying the schema migration.
 * Run the migration first with:
 *   npx prisma migrate dev --name add-multi-board-support
 * 
 * Then run this script:
 *   npx ts-node prisma/migration-script.ts
 */

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

    // Get all board views and update them 
    const boardViews = await prisma.boardView.findMany();
    
    // Update them one by one
    for (const view of boardViews) {
      await prisma.boardView.update({
        where: { id: view.id },
        data: { boardId: defaultBoard.id }
      });
    }

    console.log(`Updated ${boardViews.length} board views`);

    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 