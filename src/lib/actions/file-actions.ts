'use server';

import {
  getSignedDownloadUrl,
  getUploadUrl as getUploadUrlR2
} from '../server/r2';
import { prisma } from '../db';
import { File as PrismaFile } from '@prisma/client';

export async function getFileUrlFromKey(key: string, fileName?: string) {
  try {
    const presignedUrl = await getSignedDownloadUrl(key, fileName);

    return { success: true, url: presignedUrl };
  } catch (error) {
    console.error('Error getting file download URL:', error);
    return { success: false, error: 'Failed to get file download URL' };
  }
}

export async function getUploadUrl(
  fileName: string,
  contentType: string,
  path: string
) {
  try {
    const { url, key } = await getUploadUrlR2(fileName, contentType, path);
    return { success: true, url, key };
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return { success: false, error: 'Failed to get upload URL' };
  }
}

export async function createFile(file: PrismaFile) {
  return prisma.file.create({
    data: {
      url: file.url,
      key: file.key,
      name: file.name,
      type: file.type,
      size: file.size
    }
  });
}

/**
 * Upload a file to Cloudflare R2 and save it to the database
 * This is a reusable server action that can be used across the application
 */

// NEED TO DEPRECIATE THIS
export async function uploadFileToR2AndDatabase(
  file: File,
  path: string,
  relationData?: {
    partId?: string;
    taskId?: string;
    workOrderId?: string;
    commentId?: string;
    instructionId?: string;
    stepId?: string;
  }
): Promise<{
  success: boolean;
  data?: PrismaFile;
  error?: string;
}> {
  try {
    // Upload file to R2
    const {
      url: presignedUrl,
      key,
      publicUrl
    } = await getUploadUrlR2(file.name, file.type, path);

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        url: publicUrl,
        key,
        name: file.name,
        type: file.type,
        size: file.size,
        ...relationData
      }
    });

    return {
      success: true,
      data: fileRecord
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
}

export async function getDownloadUrl(file: PrismaFile) {
  return getSignedDownloadUrl(file.key, file.name);
}

/**
 * Downloads multiple files sequentially with original filenames
 * @param files - Array of file objects from the database
 * @returns Promise that resolves when all downloads are complete
 */
export async function downloadMultipleFiles(
  files: PrismaFile[]
): Promise<void> {
  if (files.length === 0) {
    return;
  }

  if (files.length === 1) {
    return downloadFile(files[0]);
  }

  try {
    // Download files sequentially to avoid overwhelming the browser
    for (const file of files) {
      await downloadFile(file);
      // Small delay between downloads to prevent browser issues
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Error downloading multiple files:', error);
  }
}
