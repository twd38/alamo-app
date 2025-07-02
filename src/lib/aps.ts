/**
 * Autodesk Platform Services (APS) Integration
 * Handles authentication, file upload, and model derivative operations using direct REST API calls
 */

// APS Configuration
const APS_CONFIG = {
  clientId: process.env.APS_CLIENT_ID!,
  clientSecret: process.env.APS_CLIENT_SECRET!,
  baseUrl: 'https://developer.api.autodesk.com',
  scope:
    'data:read data:write data:create bucket:create bucket:read bucket:update bucket:delete'
};

// Validate required environment variables
if (!APS_CONFIG.clientId || !APS_CONFIG.clientSecret) {
  throw new Error(
    'APS_CLIENT_ID and APS_CLIENT_SECRET environment variables are required'
  );
}

/**
 * Get a 2-legged OAuth token for server-side operations
 */
export async function getAPSToken(): Promise<string> {
  try {
    const response = await fetch(
      `${APS_CONFIG.baseUrl}/authentication/v2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: APS_CONFIG.clientId,
          client_secret: APS_CONFIG.clientSecret,
          grant_type: 'client_credentials',
          scope: APS_CONFIG.scope
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Authentication response:', response.status, errorText);
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to get APS token:', error);
    throw new Error('Authentication failed');
  }
}

/**
 * Get a public access token for viewer operations (frontend)
 */
export async function getViewerToken(): Promise<{
  access_token: string;
  expires_in: number;
}> {
  try {
    const response = await fetch(
      `${APS_CONFIG.baseUrl}/authentication/v2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: APS_CONFIG.clientId,
          client_secret: APS_CONFIG.clientSecret,
          grant_type: 'client_credentials',
          scope: 'viewables:read'
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Viewer authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('Failed to get viewer token:', error);
    throw new Error('Viewer authentication failed');
  }
}

/**
 * Create or get an existing bucket
 */
export async function createOrGetBucket(
  bucketKey: string,
  token: string
): Promise<any> {
  try {
    // Try to get existing bucket first
    const getResponse = await fetch(
      `${APS_CONFIG.baseUrl}/oss/v2/buckets/${bucketKey}/details`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (getResponse.ok) {
      return await getResponse.json();
    }

    // If bucket doesn't exist (404), create it
    if (getResponse.status === 404) {
      const bucketSpec = {
        bucketKey: bucketKey,
        policyKey: 'transient' // Files will be deleted after 24 hours
      };

      const createResponse = await fetch(
        `${APS_CONFIG.baseUrl}/oss/v2/buckets`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bucketSpec)
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(
          'Bucket creation failed:',
          createResponse.status,
          errorText
        );
        throw new Error(
          `Failed to create bucket: ${createResponse.statusText}`
        );
      }

      return await createResponse.json();
    }

    const errorText = await getResponse.text();
    console.error('Bucket retrieval failed:', getResponse.status, errorText);
    throw new Error(`Failed to get bucket: ${getResponse.statusText}`);
  } catch (error) {
    console.error('Failed to create or get bucket:', error);
    throw new Error('Bucket operation failed');
  }
}

/**
 * Upload a file to APS using the modern S3-style signed upload
 */
export async function uploadFileToAPS(
  bucketKey: string,
  objectKey: string,
  fileBuffer: Buffer,
  token: string
): Promise<string> {
  try {
    console.log(
      `Starting upload: ${objectKey} (${fileBuffer.length} bytes) to bucket ${bucketKey}`
    );

    // Ensure bucket exists
    await createOrGetBucket(bucketKey, token);

    // Use S3-style signed upload for all files (modern approach)
    // For files larger than 100MB, we could use multipart, but single part works for most cases
    const fileSize = fileBuffer.length;
    const MAX_SINGLE_PART = 100 * 1024 * 1024; // 100MB

    if (fileSize <= MAX_SINGLE_PART) {
      return await uploadWithS3SignedUrl(
        bucketKey,
        objectKey,
        fileBuffer,
        token
      );
    } else {
      return await uploadLargeFileS3(bucketKey, objectKey, fileBuffer, token);
    }
  } catch (error) {
    console.error('Failed to upload file to APS:', error);
    throw new Error('File upload failed');
  }
}

/**
 * Upload using S3-style signed URLs (modern APS approach)
 */
async function uploadWithS3SignedUrl(
  bucketKey: string,
  objectKey: string,
  fileBuffer: Buffer,
  token: string
): Promise<string> {
  try {
    console.log(`Getting S3 signed URL for upload: ${objectKey}`);

    // Get S3 signed URL for single part upload (use GET with parts=1 query param)
    const signedResponse = await fetch(
      `${APS_CONFIG.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload?parts=1`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!signedResponse.ok) {
      const errorText = await signedResponse.text();
      console.error(
        'S3 signed URL creation failed:',
        signedResponse.status,
        errorText
      );
      throw new Error(
        `Failed to get S3 signed URL: ${signedResponse.statusText}`
      );
    }

    const signedData = await signedResponse.json();
    console.log('Got S3 signed URL, uploading file...');

    // Upload using the S3 signed URL
    const uploadResponse = await fetch(signedData.urls[0], {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('S3 file upload failed:', uploadResponse.status, errorText);
      throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
    }

    // Get the ETag from the response
    const etag = uploadResponse.headers.get('ETag')?.replace(/"/g, '') || '';
    console.log('File uploaded to S3, completing upload...');

    // Complete the upload
    const completeResponse = await fetch(
      `${APS_CONFIG.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadKey: signedData.uploadKey,
          eTags: [etag]
        })
      }
    );

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      console.error(
        'Upload completion failed:',
        completeResponse.status,
        errorText
      );
      throw new Error(
        `Failed to complete upload: ${completeResponse.statusText}`
      );
    }

    const completeData = await completeResponse.json();
    console.log('Upload completed successfully:', completeData);

    // Return the object URN for translation
    return (
      completeData.objectId ||
      `urn:adsk.objects:os.object:${bucketKey}:${objectKey}`
    );
  } catch (error) {
    console.error('Failed S3 signed upload:', error);
    throw error;
  }
}

/**
 * Upload large files using multipart S3-style upload
 */
async function uploadLargeFileS3(
  bucketKey: string,
  objectKey: string,
  fileBuffer: Buffer,
  token: string
): Promise<string> {
  const fileSize = fileBuffer.length;
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const totalParts = Math.ceil(fileSize / CHUNK_SIZE);

  try {
    console.log(`Starting multipart S3 upload: ${totalParts} parts`);

    // Get signed URLs for multipart upload (use GET with parts query param)
    const signedUrlResponse = await fetch(
      `${APS_CONFIG.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload?parts=${totalParts}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!signedUrlResponse.ok) {
      const errorText = await signedUrlResponse.text();
      console.error(
        'Multipart signed URL failed:',
        signedUrlResponse.status,
        errorText
      );
      throw new Error(
        `Failed to get signed URLs: ${signedUrlResponse.statusText}`
      );
    }

    const signedData = await signedUrlResponse.json();
    const { uploadKey, urls } = signedData;

    // Upload parts
    const eTags: string[] = [];
    for (let i = 0; i < totalParts; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = fileBuffer.slice(start, end);

      console.log(`Uploading part ${i + 1}/${totalParts}`);

      const uploadResponse = await fetch(urls[i], {
        method: 'PUT',
        body: chunk,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(
          `Failed to upload part ${i + 1}: ${uploadResponse.statusText}`
        );
      }

      const etag = uploadResponse.headers.get('ETag')?.replace(/"/g, '') || '';
      eTags.push(etag);
    }

    // Complete multipart upload
    const completeResponse = await fetch(
      `${APS_CONFIG.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}/signeds3upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadKey,
          eTags
        })
      }
    );

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      console.error(
        'Multipart upload completion failed:',
        completeResponse.status,
        errorText
      );
      throw new Error(
        `Failed to complete upload: ${completeResponse.statusText}`
      );
    }

    const completeData = await completeResponse.json();
    console.log('Multipart upload completed successfully:', completeData);
    return completeData.objectId;
  } catch (error) {
    console.error('Failed to upload large file:', error);
    throw new Error('Large file upload failed');
  }
}

/**
 * Direct upload for smaller files (DEPRECATED - kept for reference)
 */
async function directUpload(
  bucketKey: string,
  objectKey: string,
  fileBuffer: Buffer,
  token: string
): Promise<string> {
  try {
    console.log(`Direct upload: ${objectKey} (DEPRECATED)`);

    const uploadResponse = await fetch(
      `${APS_CONFIG.baseUrl}/oss/v2/buckets/${bucketKey}/objects/${objectKey}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileBuffer.length.toString()
        },
        body: fileBuffer
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Direct upload failed:', uploadResponse.status, errorText);

      // Log more details about the failure
      console.error('Upload details:', {
        bucket: bucketKey,
        object: objectKey,
        size: fileBuffer.length,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText
      });

      throw new Error(
        `Upload failed: ${uploadResponse.statusText} - ${errorText}`
      );
    }

    const result = await uploadResponse.json();
    console.log('Direct upload successful:', result);

    // Return the object URN
    return (
      result.objectId || `urn:adsk.objects:os.object:${bucketKey}:${objectKey}`
    );
  } catch (error) {
    console.error('Failed direct upload:', error);
    throw error;
  }
}

/**
 * Translate a file to SVF2 format for viewing
 */
export async function translateModel(
  urn: string,
  token: string
): Promise<string> {
  try {
    console.log(`Starting translation for URN: ${urn}`);

    // Base64 encode the URN (without padding)
    const base64Urn = Buffer.from(urn).toString('base64').replace(/=/g, '');

    const translationSpec = {
      input: {
        urn: base64Urn
      },
      output: {
        destination: {
          region: 'us'
        },
        formats: [
          {
            type: 'svf2',
            views: ['2d', '3d']
          }
        ]
      }
    };

    const response = await fetch(
      `${APS_CONFIG.baseUrl}/modelderivative/v2/designdata/job`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(translationSpec)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation failed:', response.status, errorText);
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Translation started successfully');
    return result.urn || base64Urn;
  } catch (error) {
    console.error('Failed to translate model:', error);
    throw new Error('Model translation failed');
  }
}

/**
 * Helper function to ensure URN is properly base64 encoded for API calls
 */
function ensureBase64Urn(urn: string): string {
  try {
    // Check if it's already base64 encoded by trying to decode it
    const decoded = Buffer.from(urn, 'base64').toString();
    if (decoded.startsWith('urn:adsk.objects:os.object:')) {
      // Already base64 encoded - use as is
      return urn;
    }
  } catch {
    // Not valid base64, continue with encoding
  }

  // If it starts with 'urn:adsk.objects:os.object:', encode it
  if (urn.startsWith('urn:adsk.objects:os.object:')) {
    return Buffer.from(urn).toString('base64').replace(/=/g, '');
  }

  // Assume it's already in the correct format
  return urn;
}

/**
 * Get translation status (manifest)
 */
export async function getTranslationStatus(
  urn: string,
  token: string
): Promise<any> {
  try {
    // Ensure URN is properly base64 encoded
    const base64Urn = ensureBase64Urn(urn);

    const response = await fetch(
      `${APS_CONFIG.baseUrl}/modelderivative/v2/designdata/${base64Urn}/manifest`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get manifest: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get translation status:', error);
    throw new Error('Failed to get translation status');
  }
}

/**
 * Get model metadata
 */
export async function getModelMetadata(
  urn: string,
  token: string
): Promise<any> {
  try {
    // Ensure URN is properly base64 encoded
    const base64Urn = ensureBase64Urn(urn);

    const response = await fetch(
      `${APS_CONFIG.baseUrl}/modelderivative/v2/designdata/${base64Urn}/metadata`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get metadata: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get model metadata:', error);
    throw new Error('Failed to get model metadata');
  }
}

/**
 * Get model properties for a specific GUID
 */
export async function getModelProperties(
  urn: string,
  guid: string,
  token: string
): Promise<any> {
  try {
    // Ensure URN is properly base64 encoded
    const base64Urn = ensureBase64Urn(urn);

    const response = await fetch(
      `${APS_CONFIG.baseUrl}/modelderivative/v2/designdata/${base64Urn}/metadata/${guid}/properties`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get properties: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get model properties:', error);
    throw new Error('Failed to get model properties');
  }
}

/**
 * Get model hierarchy for a specific GUID
 */
export async function getModelHierarchy(
  urn: string,
  guid: string,
  token: string
): Promise<any> {
  try {
    // Ensure URN is properly base64 encoded
    const base64Urn = ensureBase64Urn(urn);

    const response = await fetch(
      `${APS_CONFIG.baseUrl}/modelderivative/v2/designdata/${base64Urn}/metadata/${guid}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get hierarchy: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get model hierarchy:', error);
    throw new Error('Failed to get model hierarchy');
  }
}

/**
 * Generate a bucket key based on user/organization
 */
export function generateBucketKey(prefix: string = 'alamo-app'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`.toLowerCase();
}

/**
 * Generate object key from filename
 */
export function generateObjectKey(filename: string): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}-${sanitized}`;
}
