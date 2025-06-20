import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { File } from 'lucide-react';

interface ImageInputProps {
  onChange: (file: File | null) => void;
  value?: File | null;
}

const ImageInput: React.FC<ImageInputProps> = ({ onChange, value }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      setPreview(URL.createObjectURL(file));
      onChange(file);
    } else {
      setPreview(null);
      onChange(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-32 h-32 object-cover mb-2"
        />
      )}
      <label htmlFor="image-upload" className="cursor-pointer">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 bg-secondary"
          onClick={() => {
            const fileInput = document.getElementById(
              'image-upload'
            ) as HTMLInputElement;
            fileInput.click();
          }}
        >
          <File className="h-4 w-4" />
          {value ? 'Change Image' : 'Upload Image'}
        </Button>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export { ImageInput };
