import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Initialize S3 client with R2 configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
const UPLOAD_URL_EXPIRY = 3600; // 1 hour
const DOWNLOAD_URL_EXPIRY = 3600; // 1 hour

// Helper to sanitize filenames
function sanitizeFileName(fileName: string): string {
  // Remove special characters and spaces, keep extension
  const ext = fileName.split('.').pop() || '';
  const name = fileName.slice(0, -(ext.length + 1));
  const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50);
  return ext ? `${sanitized}.${ext}` : sanitized;
}

export async function getUploadUrl(
  fileName: string,
  contentType: string,
  path: string
): Promise<{ url: string; key: string; publicUrl: string; name: string }> {
  // Generate unique key with UUID to prevent collisions
  const sanitizedName = sanitizeFileName(fileName);
  const key = `${path}/${randomUUID()}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType
  });

  const presignedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY
  });

  return {
    name: fileName,
    url: presignedUrl,
    key,
    publicUrl: `${PUBLIC_URL}/${key}`
  };
}

export async function deleteFileFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  await r2Client.send(command);
}

export async function getSignedDownloadUrl(
  key: string,
  fileName?: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileName || key}"`
  });

  const signedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY
  });
  return signedUrl;
}

export async function getSignedDownloadUrlFromPublicUrl(
  publicUrl: string
): Promise<string> {
  // Extract key from public URL
  if (!publicUrl.startsWith(PUBLIC_URL)) {
    throw new Error('Invalid public URL');
  }

  const key = publicUrl.replace(`${PUBLIC_URL}/`, '');
  return getSignedDownloadUrl(key);
}

// Helper to get key from public URL
export function getKeyFromPublicUrl(publicUrl: string): string {
  if (!publicUrl.startsWith(PUBLIC_URL)) {
    throw new Error('Invalid public URL');
  }
  return publicUrl.replace(`${PUBLIC_URL}/`, '');
}

// Helper to get public URL from key
export function getPublicUrlFromKey(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}
