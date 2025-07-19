'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { CommentableEntityType } from '@prisma/client';
import { z } from 'zod';
import { getUploadUrl } from '@/lib/server/r2';
import { notify } from '@/lib/server/notification-service';

// Validation schemas
const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(5000, 'Comment content is too long'),
  entityType: z.nativeEnum(CommentableEntityType),
  entityUrl: z.string().optional(),
  entityId: z.string().min(1, 'Entity ID is required'),
  parentId: z.string().optional(),
  files: z.array(z.any()).optional(), // Files will be validated separately
  mentionedUserIds: z.array(z.string()).optional().default([]) // Array of mentioned user IDs
});

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(5000, 'Comment content is too long')
});

// Type definitions
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

// Simplified type to avoid complex nested Prisma type issues
export type CommentWithAuthor = any;

/**
 * Create a new comment
 */
export async function createComment(input: CreateCommentInput): Promise<{
  success: boolean;
  data?: CommentWithAuthor;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input
    const validatedData = createCommentSchema.parse(input);

    // Verify entity exists (basic check)
    await verifyEntityExists(validatedData.entityType, validatedData.entityId);

    // If parentId is provided, verify parent comment exists and is not deleted
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: validatedData.parentId,
          deletedAt: null
        }
      });

      if (!parentComment) {
        return { success: false, error: 'Parent comment not found' };
      }

      // Ensure parent comment belongs to the same entity
      if (
        parentComment.entityType !== validatedData.entityType ||
        parentComment.entityId !== validatedData.entityId
      ) {
        return {
          success: false,
          error: 'Parent comment must belong to the same entity'
        };
      }
    }

    // Handle file uploads if provided
    const uploadedFiles = [];
    if (validatedData.files && validatedData.files.length > 0) {
      for (const file of validatedData.files) {
        if (file instanceof File) {
          // Validate file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            return {
              success: false,
              error: `File ${file.name} is too large (max 10MB)`
            };
          }

          try {
            // Upload file to R2
            const { url: presignedUrl, key } = await getUploadUrl(
              file.name,
              file.type,
              'comments'
            );

            const uploadResponse = await fetch(presignedUrl, {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type
              }
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }

            uploadedFiles.push({
              url: '', // We'll generate URLs dynamically via API
              key,
              name: file.name,
              type: file.type,
              size: file.size
            });
          } catch (error) {
            console.error('Error uploading file:', error);
            return {
              success: false,
              error: `Failed to upload ${file.name}`
            };
          }
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        parentId: validatedData.parentId || null,
        authorId: session.user.id,
        mentionedUserIds: validatedData.mentionedUserIds || [], // TODO: Add back when Prisma types are updated
        ...(uploadedFiles.length > 0 && {
          files: {
            create: uploadedFiles
          }
        })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        files: true
      }
    });

    // Send notifications to mentioned users
    const mentionedUserIds = validatedData.mentionedUserIds || [];
    if (mentionedUserIds.length > 0) {
      try {
        const author = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true }
        });
        const authorName = author?.name || 'Someone';

        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        const message = `${authorName} mentioned you in a <${appUrl}${validatedData.entityUrl}|comment>.`;

        await notify({
          recipientIds: mentionedUserIds,
          message
        });
      } catch (error) {
        console.error('Error sending mention notifications:', error);
        // Don't fail the comment creation if notifications fail
      }
    }

    // Revalidate relevant paths
    revalidateEntityPath(validatedData.entityType, validatedData.entityId);

    return { success: true, data: comment };
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to create comment' };
  }
}

/**
 * Get comments for a specific entity
 */
export async function getEntityComments(
  entityType: CommentableEntityType,
  entityId: string,
  includeReplies: boolean = true
): Promise<{
  success: boolean;
  data?: CommentWithAuthor[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Get top-level comments (no parent)
    const topLevelComments = await prisma.comment.findMany({
      where: {
        entityType,
        entityId,
        parentId: null,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        files: true,
        ...(includeReplies && {
          replies: {
            where: {
              deletedAt: null
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              },
              files: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        })
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return { success: true, data: topLevelComments };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { success: false, error: 'Failed to fetch comments' };
  }
}

/**
 * Update a comment (only content can be updated)
 */
export async function updateComment(
  commentId: string,
  input: UpdateCommentInput
): Promise<{
  success: boolean;
  data?: CommentWithAuthor;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate input
    const validatedData = updateCommentSchema.parse(input);

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId: session.user.id,
        deletedAt: null
      }
    });

    if (!existingComment) {
      return {
        success: false,
        error: 'Comment not found or you do not have permission to update it'
      };
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Revalidate relevant paths
    revalidateEntityPath(existingComment.entityType, existingComment.entityId);

    return { success: true, data: updatedComment };
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update comment' };
  }
}

/**
 * Soft delete a comment
 */
export async function deleteComment(commentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if comment exists and user is the author
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId: session.user.id,
        deletedAt: null
      }
    });

    if (!existingComment) {
      return {
        success: false,
        error: 'Comment not found or you do not have permission to delete it'
      };
    }

    // Soft delete the comment and all its replies
    await prisma.$transaction(async (tx) => {
      // Soft delete the comment
      await tx.comment.update({
        where: { id: commentId },
        data: { deletedAt: new Date() }
      });

      // Soft delete all replies
      await tx.comment.updateMany({
        where: {
          parentId: commentId,
          deletedAt: null
        },
        data: { deletedAt: new Date() }
      });
    });

    // Revalidate relevant paths
    revalidateEntityPath(existingComment.entityType, existingComment.entityId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

/**
 * Get comment by ID
 */
export async function getComment(commentId: string): Promise<{
  success: boolean;
  data?: CommentWithAuthor;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    return { success: true, data: comment };
  } catch (error) {
    console.error('Error fetching comment:', error);
    return { success: false, error: 'Failed to fetch comment' };
  }
}

/**
 * Get comment count for an entity
 */
export async function getEntityCommentCount(
  entityType: CommentableEntityType,
  entityId: string
): Promise<number> {
  try {
    return await prisma.comment.count({
      where: {
        entityType,
        entityId,
        deletedAt: null
      }
    });
  } catch (error) {
    console.error('Error counting comments:', error);
    return 0;
  }
}

// Helper functions

/**
 * Verify that an entity exists based on its type and ID
 */
async function verifyEntityExists(
  entityType: CommentableEntityType,
  entityId: string
): Promise<void> {
  let exists = false;

  try {
    switch (entityType) {
      case CommentableEntityType.WORK_ORDER:
        exists = !!(await prisma.workOrder.findUnique({
          where: { id: entityId }
        }));
        break;
      case CommentableEntityType.TASK:
        exists = !!(await prisma.task.findUnique({
          where: { id: entityId, deletedOn: null }
        }));
        break;
      case CommentableEntityType.PART:
        exists = !!(await prisma.part.findUnique({ where: { id: entityId } }));
        break;
      case CommentableEntityType.WORK_INSTRUCTION:
        const workInstruction = await prisma.workInstruction.findUnique({
          where: { id: entityId }
        });
        console.log(
          `Work instruction lookup for ID ${entityId}:`,
          workInstruction
        );
        exists = !!workInstruction;
        break;
      case CommentableEntityType.WORK_INSTRUCTION_STEP:
        exists = !!(await prisma.workInstructionStep.findUnique({
          where: { id: entityId }
        }));
        break;
      case CommentableEntityType.WORK_ORDER_WORK_INSTRUCTION_STEP:
        exists = !!(await prisma.workOrderWorkInstructionStep.findUnique({
          where: { id: entityId }
        }));
        break;
      case CommentableEntityType.BOARD:
        exists = !!(await prisma.board.findUnique({ where: { id: entityId } }));
        break;
      case CommentableEntityType.EPIC:
        exists = !!(await prisma.epic.findUnique({ where: { id: entityId } }));
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  } catch (dbError) {
    console.error(
      `Database error while verifying ${entityType} with ID ${entityId}:`,
      dbError
    );
    throw new Error(`Failed to verify entity existence: ${dbError}`);
  }

  if (!exists) {
    console.error(
      `Entity verification failed: ${entityType} with ID ${entityId} not found`
    );
    throw new Error(
      `Entity of type ${entityType} with ID ${entityId} not found`
    );
  }
}

/**
 * Revalidate cache paths for a specific entity
 */
/**
 * Get a display name for the entity type
 */
function getEntityDisplayName(entityType: CommentableEntityType): string {
  switch (entityType) {
    case CommentableEntityType.WORK_ORDER:
      return 'a work order';
    case CommentableEntityType.TASK:
      return 'a task';
    case CommentableEntityType.PART:
      return 'a part';
    case CommentableEntityType.WORK_INSTRUCTION:
      return 'a work instruction';
    case CommentableEntityType.WORK_INSTRUCTION_STEP:
      return 'a work instruction step';
    case CommentableEntityType.WORK_ORDER_WORK_INSTRUCTION_STEP:
      return 'a work order step';
    case CommentableEntityType.BOARD:
      return 'a board';
    case CommentableEntityType.EPIC:
      return 'an epic';
    default:
      return 'an item';
  }
}

function revalidateEntityPath(
  entityType: CommentableEntityType,
  entityId: string
): void {
  switch (entityType) {
    case CommentableEntityType.WORK_ORDER:
      revalidatePath(`/production/${entityId}`);
      revalidatePath('/production');
      break;
    case CommentableEntityType.TASK:
      revalidatePath('/board');
      break;
    case CommentableEntityType.PART:
      revalidatePath(`/parts/library/${entityId}`);
      revalidatePath('/parts/library');
      break;
    case CommentableEntityType.WORK_INSTRUCTION:
      revalidatePath(`/parts/library`);
      break;
    case CommentableEntityType.WORK_ORDER_WORK_INSTRUCTION_STEP:
      revalidatePath(`/production/${entityId}`);
      break;
    case CommentableEntityType.BOARD:
      revalidatePath(`/board/${entityId}`);
      revalidatePath('/board');
      break;
    case CommentableEntityType.EPIC:
      revalidatePath('/board');
      break;
  }
}
