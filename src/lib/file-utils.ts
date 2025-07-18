/**
 * Utility functions for secure file access and downloads
 */
import { toast } from 'sonner';
import { getFileUrlFromKey } from '@/lib/actions';
import type { File } from '@prisma/client';

/**
 * Get secure file URL through our API proxy
 * @param fileId - The file ID from database
 * @returns URL that goes through authentication
 */
export function getSecureFileUrl(fileId: string): string {
  return `/api/files/${fileId}`;
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

/**
 * Downloads a file using its key and preserves the original filename
 * @param file - The file object from the database containing key and name
 * @returns Promise that resolves when download is complete
 */
export async function downloadFile(file: File): Promise<void> {
  try {
    console.log('Downloading file:', file);

    const signedUrl = await getFileUrlFromKey(file.key, file.name);

    if (!signedUrl.success || !signedUrl.url) {
      toast.error('Failed to get download URL');
      return;
    }

    // Create a temporary anchor element to trigger download without opening new tab
    const link = document.createElement('a');
    link.href = signedUrl.url;
    link.download = file.name; // Suggests the filename to the browser
    link.style.display = 'none';

    // Temporarily add to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Downloaded ${file.name}`);
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Failed to download file');
  }
}

/**
 * Downloads multiple files sequentially with original filenames
 * @param files - Array of file objects from the database
 * @returns Promise that resolves when all downloads are complete
 */
export async function downloadMultipleFiles(files: File[]): Promise<void> {
  if (files.length === 0) {
    toast.error('No files to download');
    return;
  }

  if (files.length === 1) {
    return downloadFile(files[0]);
  }

  toast.info(`Starting download of ${files.length} files...`);

  try {
    // Download files sequentially to avoid overwhelming the browser
    for (const file of files) {
      await downloadFile(file);
      // Small delay between downloads to prevent browser issues
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    toast.success(`Downloaded ${files.length} files successfully`);
  } catch (error) {
    console.error('Error downloading multiple files:', error);
    toast.error('Some files failed to download');
  }
}
