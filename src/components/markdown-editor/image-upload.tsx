import { createImageUpload } from "novel";
import { toast } from "react-hot-toast";
import { getPresignedUploadUrl, getFileUrl } from "@/lib/actions";

const onUpload = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const fileName = crypto.randomUUID() + "-" + file.name;
    const folderPath = "/content";
    
    // First get a presigned URL for uploading
    toast.promise(
      (async () => {
        try {
          // Get a presigned PUT URL
          const presignedUrlResult = await getPresignedUploadUrl(fileName, file.type, folderPath);
          
          if (!presignedUrlResult.success || !presignedUrlResult.url) {
            throw new Error("Failed to get upload URL");
          }
          
          // Upload directly to R2 using fetch and the presigned URL
          const uploadResult = await fetch(presignedUrlResult.url, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file
          });
          
          if (!uploadResult.ok) {
            throw new Error(`Upload failed: ${uploadResult.statusText}`);
          }
          
          // Get the permanent URL for the file (not the presigned one)
          const key = presignedUrlResult.key;
          
          // Preload the image
          const image = new Image();
          image.src = key;
          
          return new Promise<string>((imageResolve) => {
            image.onload = () => imageResolve(key);
            image.onerror = () => {
              // If we can't load the image, still return the URL
              // as it might just be CORS or other issues
              imageResolve(key);
            };
          });
        } catch (error) {
          console.error("Upload error:", error);
          throw error;
        }
      })(),
      {
        loading: "Uploading image...",
        success: "Image uploaded successfully.",
        error: (error: Error) => {
          reject(error);
          return error.message || "Upload failed";
        },
      }
    ).then(resolve).catch(reject);
  });
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file: File) => {
    if (!file.type.includes("image/")) {
      toast.error("File type not supported.");
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      toast.error("File size too big (max 20MB).");
      return false;
    }
    return true;
  },
});