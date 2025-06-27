import { createImageUpload } from 'novel';
import { toast } from 'sonner';
import { getPresignedUploadUrl, getFileUrl } from '@/lib/actions';

const onUpload = async (file: File): Promise<string> => {
  const folderPath = 'content';

  const uploadPromise = (async () => {
    // Get a presigned PUT URL
    const presignedUrlResult = await getPresignedUploadUrl(
      file.name,
      file.type,
      folderPath
    );

    if (!presignedUrlResult.success || !presignedUrlResult.url) {
      throw new Error('Failed to get upload URL');
    }

    // Upload directly to R2 using fetch and the presigned URL
    const uploadResult = await fetch(presignedUrlResult.url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResult.ok) {
      throw new Error(`Upload failed: ${uploadResult.statusText}`);
    }

    // Return just the key portion for the content route
    const key = presignedUrlResult.key;
    // Extract just the filename part after content/
    const contentKey = key.split('/').pop() || key;

    // Preload the image using the content route
    const image = new Image();
    image.src = `/content/${contentKey}`;

    return new Promise<string>((imageResolve) => {
      image.onload = () => imageResolve(`/content/${contentKey}`);
      image.onerror = () => {
        // If we can't load the image, still return the URL
        // as it might just be CORS or other issues
        imageResolve(`/content/${contentKey}`);
      };
    });
  })();

  // Show toast and return the promise result
  toast.promise(uploadPromise, {
    loading: 'Uploading image...',
    success: 'Image uploaded successfully.',
    error: (error: Error) => error.message || 'Upload failed'
  });

  return uploadPromise;
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file: File) => {
    if (!file.type.includes('image/')) {
      toast.error('File type not supported.');
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      toast.error('File size too big (max 20MB).');
      return false;
    }
    return true;
  }
});
