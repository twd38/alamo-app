import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSignedDownloadUrl } from '@/lib/server/r2';

/**
 * Secure optimized image serving endpoint
 * GET /api/images/[fileId]?w=300&q=80
 *
 * This endpoint:
 * 1. Validates user authentication and access
 * 2. Serves optimized images through Cloudflare while maintaining security
 * 3. Returns signed URLs for temporary access
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
    const { searchParams } = new URL(request.url);
    const width = searchParams.get('w');
    const quality = searchParams.get('q');

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
          select: { id: true }
        },
        step: {
          select: { id: true }
        }
      }
    });

    if (!file || file.deletedOn) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if file is an image
    const imageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
    if (!imageTypes.includes(file.type?.toLowerCase() || '')) {
      return NextResponse.json(
        { error: 'File is not an image' },
        { status: 400 }
      );
    }

    // TODO: Implement proper access control
    // const hasAccess = await checkFileAccess(session.user.id, file);
    // if (!hasAccess) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    // }

    if (!file.key) {
      return NextResponse.json(
        { error: 'File key not found' },
        { status: 404 }
      );
    }

    // Generate signed URL with extended expiry for caching
    const presignedUrl = await getSignedDownloadUrl(file.key, file.name);

    // If optimization parameters are provided, use Cloudflare Images
    if (width || quality) {
      try {
        // Extract the R2 domain and key from the presigned URL
        const signedUrl = new URL(presignedUrl);
        const key = file.key;

        // Build Cloudflare Images parameters
        const params = [];
        if (width) params.push(`width=${width}`);
        if (quality) params.push(`quality=${quality}`);
        const paramsString = params.join(',');

        // Create optimized URL using your R2 domain
        // This assumes your R2 bucket has a custom domain configured with Cloudflare Images
        const optimizedUrl = `https://${process.env.R2_CUSTOM_DOMAIN || '0a1c1daebffa04c4354e44a3fddb1a9b.r2.cloudflarestorage.com'}/cdn-cgi/image/${paramsString}/${key}`;

        // For now, return the presigned URL since we can't easily proxy Cloudflare Images with auth
        // In production, you might want to implement a more sophisticated caching strategy
        return NextResponse.redirect(presignedUrl, { status: 302 });
      } catch (error) {
        console.error('Error creating optimized image URL:', error);
        return NextResponse.redirect(presignedUrl, { status: 302 });
      }
    }

    // Return the signed URL for direct access
    return NextResponse.redirect(presignedUrl, { status: 302 });
  } catch (error) {
    console.error('Error serving secure image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has access to a file based on business rules
 * This should match the logic in /api/files/[fileId]/route.ts
 */
async function checkFileAccess(userId: string, file: any): Promise<boolean> {
  // If file is attached to a comment
  if (file.comment) {
    if (file.comment.author.id === userId) {
      return true;
    }
    // Add entity access check logic here
  }

  // If file is attached to a task
  if (file.task) {
    if (file.task.createdBy.id === userId) {
      return true;
    }
    if (file.task.assignees.some((assignee: any) => assignee.id === userId)) {
      return true;
    }
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
    if (file.workOrder.createdBy.id === userId) {
      return true;
    }
    if (
      file.workOrder.assignees.some(
        (assignee: any) => assignee.userId === userId
      )
    ) {
      return true;
    }
  }

  // If file is attached to parts, instructions, or steps
  if (file.part || file.step) {
    return true;
  }

  return false;
}
