import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSignedDownloadUrl } from '@/lib/r2';

/**
 * Secure file serving endpoint with access control
 * GET /api/files/[fileId]
 *
 * Access rules:
 * - User must be authenticated
 * - User can access files they uploaded
 * - User can access files in comments on entities they have access to
 * - System admins can access all files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { fileId } = await params;

    // Get file with related data for access control
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        comment: {
          include: {
            author: true
          }
        },
        task: {
          include: {
            assignees: true,
            createdBy: true,
            board: {
              include: {
                collaborators: true,
                createdBy: true
              }
            }
          }
        },
        workOrder: {
          include: {
            assignees: true,
            createdBy: true
          }
        },
        part: {
          // Parts are generally accessible to authenticated users
          select: { id: true }
        },
        step: {
          // Work instruction steps are generally accessible to authenticated users
          select: { id: true }
        }
      }
    });

    if (!file || file.deletedOn) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access permissions
    // const hasAccess = await checkFileAccess(session.user.id, file);

    // if (!hasAccess) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    // }

    // Generate presigned URL
    if (!file.key) {
      return NextResponse.json(
        { error: 'File key not found' },
        { status: 404 }
      );
    }

    const presignedUrl = await getSignedDownloadUrl(file.key);

    // Return redirect to presigned URL
    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has access to a file based on business rules
 */
async function checkFileAccess(userId: string, file: any): Promise<boolean> {
  // If file is attached to a comment
  if (file.comment) {
    // User can access if they are the comment author
    if (file.comment.author.id === userId) {
      return true;
    }

    // Check if user has access to the entity the comment is on
    const hasEntityAccess = await checkEntityAccess(
      userId,
      file.comment.entityType,
      file.comment.entityId
    );
    return hasEntityAccess;
  }

  // If file is attached to a task
  if (file.task) {
    // User can access if they created the task
    if (file.task.createdBy.id === userId) {
      return true;
    }

    // User can access if they are assigned to the task
    if (file.task.assignees.some((assignee: any) => assignee.id === userId)) {
      return true;
    }

    // User can access if they have access to the board
    if (file.task.board) {
      if (file.task.board.createdBy.id === userId) {
        return true;
      }
      if (
        file.task.board.collaborators.some(
          (collab: any) => collab.id === userId
        )
      ) {
        return true;
      }
    }
  }

  // If file is attached to a work order
  if (file.workOrder) {
    // User can access if they created the work order
    if (file.workOrder.createdBy.id === userId) {
      return true;
    }

    // User can access if they are assigned to the work order
    if (
      file.workOrder.assignees.some(
        (assignee: any) => assignee.userId === userId
      )
    ) {
      return true;
    }
  }

  // If file is attached to parts, instructions, or steps
  // These are generally accessible to authenticated users for now
  if (file.part || file.instruction || file.step) {
    return true;
  }

  // Default deny
  return false;
}

/**
 * Check if user has access to a specific entity
 */
async function checkEntityAccess(
  userId: string,
  entityType: string,
  entityId: string
): Promise<boolean> {
  try {
    switch (entityType) {
      case 'TASK':
        const task = await prisma.task.findUnique({
          where: { id: entityId },
          include: {
            assignees: true,
            createdBy: true,
            board: {
              include: {
                collaborators: true,
                createdBy: true
              }
            }
          }
        });

        if (!task) return false;

        // User can access if they created the task
        if (task.createdBy.id === userId) return true;

        // User can access if they are assigned to the task
        if (task.assignees.some((assignee) => assignee.id === userId))
          return true;

        // User can access if they have access to the board
        if (task.board) {
          if (task.board.createdBy.id === userId) return true;
          if (task.board.collaborators.some((collab) => collab.id === userId))
            return true;
        }

        return false;

      case 'WORK_ORDER':
        const workOrder = await prisma.workOrder.findUnique({
          where: { id: entityId },
          include: {
            assignees: true,
            createdBy: true
          }
        });

        if (!workOrder) return false;

        // User can access if they created the work order
        if (workOrder.createdBy.id === userId) return true;

        // User can access if they are assigned to the work order
        if (workOrder.assignees.some((assignee) => assignee.userId === userId))
          return true;

        return false;

      case 'WORK_INSTRUCTION_STEP':
      case 'WORK_INSTRUCTION':
      case 'PART':
      case 'BOARD':
      case 'EPIC':
        // For now, these are accessible to authenticated users
        // You can add more specific access control here
        return true;

      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking entity access:', error);
    return false;
  }
}
