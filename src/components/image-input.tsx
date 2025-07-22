import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { File, Loader2, X, Upload } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { getUploadUrl } from '@/lib/actions/file-actions';
import { useRouter } from 'next/navigation';

interface ImageInputProps {
  onChange: (file: Prisma.FileCreateInput | null) => void;
  value?: string | null;
  uploadPath: string;
}

const ImageInput: React.FC<ImageInputProps> = ({
  onChange,
  value,
  uploadPath
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [removedExisting, setRemovedExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToR2 = async (
    file: File
  ): Promise<Prisma.FileCreateInput | null> => {
    if (!uploadPath) {
      return null;
    }

    try {
      const uploadUrl = await getUploadUrl(file.name, file.type, uploadPath);
      if (!uploadUrl.url) {
        throw new Error('Failed to get upload URL');
      }

      const response = await fetch(uploadUrl.url, {
        method: 'PUT',
        body: file
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      return {
        url: uploadUrl.url,
        key: uploadUrl.key,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    // Set preview immediately for better UX
    setPreview(URL.createObjectURL(file));
    setRemovedExisting(true); // Mark existing as removed when uploading new
    setIsUploading(true);

    try {
      const uploadedFile = await uploadToR2(file);
      if (uploadedFile) {
        onChange(uploadedFile);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload image');
      setPreview(null);
      onChange(null);
      setRemovedExisting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setRemovedExisting(true);
    onChange(null);
    // Reset the file input so user can upload the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  // Determine what image to show
  const hasNewImage = preview !== null;
  const hasExistingImage = value && !removedExisting;
  const showImage = hasNewImage || hasExistingImage;
  const imageSource = hasNewImage ? preview : value;

  return (
    <div className="flex flex-col items-start">
      {showImage ? (
        <div className="relative">
          <Image
            src={imageSource!}
            alt="Image preview"
            width={128}
            height={128}
            className="w-32 h-32 object-cover rounded-lg cursor-pointer"
            unoptimized={hasNewImage}
            onClick={triggerFileInput}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
          onClick={triggerFileInput}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 text-center">
                Click to upload
              </span>
            </>
          )}
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
};

export { ImageInput };
