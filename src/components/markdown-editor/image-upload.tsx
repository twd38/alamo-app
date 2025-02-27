import { createImageUpload } from "novel";
import { toast } from "react-hot-toast";
import { uploadFile, getPresignedFileUrl } from "@/app/actions";

const onUpload = (file: File) => {
  const promise = uploadFile(file, "contentFiles");

  return new Promise((resolve, reject) => {
    toast.promise(
      promise.then(async (res) => {
        // Successfully uploaded image
        if (res.success) {
          const url = res.url;
          // Get presigned URL for the uploaded image
          const presignedResult = await getPresignedFileUrl(url);
          const finalUrl = presignedResult.success && presignedResult.url ? presignedResult.url : url;
          
          // preload the image
          const image = new Image();
          image.src = finalUrl;
          image.onload = () => {
            resolve(finalUrl); // We store the original URL, not the presigned one
          };
          // No blob store configured
        } else if (!res.success) {
          resolve(file);
          throw new Error("`BLOB_READ_WRITE_TOKEN` environment variable not found, reading image locally instead.");
          // Unknown error
        } else {
          throw new Error("Error uploading image. Please try again.");
        }
      }),
      {
        loading: "Uploading image...",
        success: "Image uploaded successfully.",
        error: (e: any) => {
          reject(e);
          return e.message;
        },
      },
    );
  });
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
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