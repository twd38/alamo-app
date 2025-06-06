import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client with R2 configuration
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function getUploadUrl(fileName: string, contentType: string, path: string): Promise<{ url: string; key: string }> {
  const key = `${path}/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  return {
    url: presignedUrl,
    key,
  };
}


export async function uploadFileToR2(file: File, path: string): Promise<{ url: string; key: string }> {
  const key = `${path}/${Date.now()}-${file.name}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: file.type,
  });

  // Upload file using a presigned URL
  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  const upload = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!upload.ok) {
    throw new Error("Failed to upload file to R2");
  }

  // Return the public URL and key
  return {
    url: `${PUBLIC_URL}/${key}`,
    key,
  };
}

export async function deleteFileFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}


export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // Get presigned URL for download
  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  return signedUrl;
} 

export async function getSignedDownloadUrlFromUnsignedUrl(url: string): Promise<string> {
  // remove the public url from the url
  console.log('url', url)
  const key = url.replace(`${PUBLIC_URL}/`, '');
  console.log('key', key)
  const signedUrl = await getSignedDownloadUrl(key);
  return signedUrl;
}

