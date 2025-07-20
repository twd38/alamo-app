import { File as PrismaFile } from '@prisma/client';
import { getDownloadUrl } from './actions/file-actions';

/**
 * Get secure file URL through our API proxy
 * @param fileId - The file ID from database
 * @returns URL that goes through authentication
 */
export function getSecureFileUrl(fileId: string): string {
  // Get domain from env
  return `/api/files/${fileId}`;
}

/**
 * Get secure image URL optimized through Next.js Image component
 * @param fileId - The file ID from database
 * @returns URL that works with Next.js Image component and Cloudflare optimization
 */
export function getSecureImageUrl(fileId: string): string {
  // This URL will be processed by our custom image loader for secure access
  return `/api/images/${fileId}`;
}

/**
 * Check if a file URL is a secure proxy URL
 * @param url - The URL to check
 * @returns True if it's a secure proxy URL
 */
export function isSecureFileUrl(url: string): boolean {
  return url.startsWith('/api/files/');
}

/**
 * Downloads a file using its key and preserves the original filename
 * @param file - The file object from the database containing key and name
 * @returns Promise that resolves when download is complete
 */
export async function downloadFile(file: PrismaFile): Promise<void> {
  try {
    const signedUrl = await getDownloadUrl(file);

    // Create a temporary anchor element to trigger download without opening new tab
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = file.name; // Suggests the filename to the browser
    link.style.display = 'none';

    // Temporarily add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

/**
 * Handle secure file download by opening in new tab
 * This triggers our authentication flow and redirects to presigned URL
 * @param fileId - The file ID from database
 * @param fileName - Optional file name for better UX
 */
export function downloadSecureFile(fileId: string, fileName?: string): void {
  const secureUrl = getSecureFileUrl(fileId);

  // Open in new tab - this will trigger authentication and redirect
  const link = document.createElement('a');
  link.href = secureUrl;
  link.target = '_blank';
  if (fileName) {
    link.download = fileName;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get display URL for files (used for images that need to be shown inline)
 * For security, we still go through our API proxy
 * @param fileId - The file ID from database
 * @returns URL for display
 */
export function getSecureDisplayUrl(fileId: string): string {
  return getSecureFileUrl(fileId);
}
