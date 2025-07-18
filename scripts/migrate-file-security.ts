/**
 * Migration script to update existing files for secure access
 * This script will:
 * 1. Clear public URLs from database for security
 * 2. Ensure all files have proper keys for R2 access
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateFilesSecurity() {
  console.log('Starting file security migration...');

  try {
    // Get all files that have URLs but might need security updates
    const files = await prisma.file.findMany({
      where: {
        deletedOn: null
      },
      select: {
        id: true,
        url: true,
        key: true,
        name: true,
        commentId: true,
        taskId: true,
        workOrderId: true,
        partId: true,
        stepId: true
      }
    });

    console.log(`Found ${files.length} files to process`);

    // Update files to remove public URLs for security
    // We keep the key which is what we need for secure access
    let updatedCount = 0;

    for (const file of files) {
      // Only update comment files for now to test the new system
      if (file.commentId && file.url && file.url !== '') {
        await prisma.file.update({
          where: { id: file.id },
          data: {
            url: '' // Clear public URL for security
          }
        });
        updatedCount++;
        console.log(`Updated file ${file.id}: ${file.name}`);
      }
    }

    console.log(`Updated ${updatedCount} comment files to use secure access`);
    console.log('File security migration completed successfully');
  } catch (error) {
    console.error('Error during file security migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateFilesSecurity()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateFilesSecurity };
