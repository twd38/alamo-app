/**
 * Utility functions for secure file access
 */

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
