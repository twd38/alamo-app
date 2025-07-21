import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/server/r2';

/**
 * Direct path-based image serving endpoint
 * GET /api/images/path/to/image.jpg?w=300&q=80
 *
 * This endpoint:
 * 1. Validates user authentication
 * 2. Uses the path directly as the R2 key
 * 3. Serves optimized images through signed URLs
 *
 * WARNING: This bypasses database-based access control.
 * Only use if you have alternative access control mechanisms.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { path } = await params;
    const { searchParams } = new URL(request.url);
    const width = searchParams.get('w');
    const quality = searchParams.get('q');

    // Reconstruct the full path from the segments
    const filePath = path.join('/');

    if (!filePath) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Basic path validation to prevent directory traversal
    if (filePath.includes('..') || filePath.includes('\\')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Optional: Validate file extension for images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = imageExtensions.some((ext) =>
      filePath.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'File is not an image' },
        { status: 400 }
      );
    }

    // TODO: Implement path-based access control if needed
    // const hasAccess = await checkPathAccess(session.user.id, filePath);
    // if (!hasAccess) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    // }

    // Extract filename from path for the signed URL
    const filename = filePath.split('/').pop() || 'image';

    // Generate signed URL using the path as the key
    const presignedUrl = await getSignedDownloadUrl(filePath, filename);

    // If optimization parameters are provided, use Cloudflare Images
    if (width || quality) {
      try {
        // Build Cloudflare Images parameters
        const params = [];
        if (width) params.push(`width=${width}`);
        if (quality) params.push(`quality=${quality}`);
        const paramsString = params.join(',');

        // Create optimized URL using your R2 domain
        // const optimizedUrl = `https://${process.env.R2_CUSTOM_DOMAIN || '0a1c1daebffa04c4354e44a3fddb1a9b.r2.cloudflarestorage.com'}/cdn-cgi/image/${paramsString}/${filePath}`;

        // For now, return the presigned URL since we can't easily proxy Cloudflare Images with auth
        return NextResponse.redirect(presignedUrl, { status: 302 });
      } catch (error) {
        console.error('Error creating optimized image URL:', error);
        return NextResponse.redirect(presignedUrl, { status: 302 });
      }
    }

    // Return the signed URL for direct access
    return NextResponse.redirect(presignedUrl, { status: 302 });
  } catch (error) {
    console.error('Error serving image by path:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Optional: Check if user has access to a specific file path
 * Implement your own path-based access control logic here
 */
async function checkPathAccess(
  userId: string,
  filePath: string
): Promise<boolean> {
  // Example implementations:

  // 1. Check if path starts with user's directory
  // if (filePath.startsWith(`users/${userId}/`)) return true;

  // 2. Check against a whitelist of public paths
  // const publicPaths = ['public/', 'shared/'];
  // if (publicPaths.some(prefix => filePath.startsWith(prefix))) return true;

  // 3. Query database for path-based permissions
  // const hasPermission = await prisma.filePermission.findFirst({
  //   where: { userId, filePath }
  // });
  // return !!hasPermission;

  // For now, allow all authenticated users
  return true;
}
