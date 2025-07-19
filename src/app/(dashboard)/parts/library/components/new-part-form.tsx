'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { TrackingType, BOMType, Part, PartType } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { BOMPartsManager } from './bom-parts-manager';
import { createPart } from '../actions/createPart';
import { uploadFileToR2AndDatabase } from '@/lib/actions/file-actions';
import { formatPartType } from '@/lib/utils';
import FileUpload from '@/components/files/file-upload';

// Interface for uploaded file data
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Define the form schema to match the createPart function exactly
const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  partNumber: z.string().optional(),
  partRevision: z
    .string()
    .regex(/^[A-Za-z]+$/, { message: 'Revision must contain only letters' })
    .optional(),
  description: z.string().min(0, { message: 'Description is required' }),
  unit: z.string().min(1, { message: 'Unit of measure is required' }),
  trackingType: z.nativeEnum(TrackingType),
  partType: z.nativeEnum(PartType),
  partImageId: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
  bomParts: z.array(
    z.object({
      id: z.string(),
      part: z.any() as z.ZodType<Part>,
      qty: z.number().min(1),
      bomType: z.nativeEnum(BOMType)
    })
  ),
  nxFilePath: z.string().optional()
});

// Additional form fields for UI state management
const formSchemaWithUiFields = formSchema.extend({
  partImageFile: z.custom<UploadedFile>().optional(),
  attachedFiles: z.array(z.custom<UploadedFile>()).optional()
});

type FormData = z.infer<typeof formSchemaWithUiFields>;
type CreatePartParams = z.infer<typeof formSchema>;

const NewPartForm = () => {
  const router = useRouter();

  // Initialize form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchemaWithUiFields),
    defaultValues: {
      name: '',
      partNumber: '',
      partRevision: 'A',
      description: '',
      unit: '',
      trackingType: TrackingType.SERIAL,
      partType: PartType.RAW_000,
      partImageFile: undefined,
      partImageId: undefined,
      attachedFiles: [],
      fileIds: [],
      bomParts: []
    }
  });

  // Handle file upload for part image
  const handlePartImageUpload = async (file: File, path: string) => {
    return await uploadFileToR2AndDatabase(file, path);
  };

  // Handle file upload for general files
  const handleFileUpload = async (file: File, path: string) => {
    return await uploadFileToR2AndDatabase(file, path);
  };

  // Handle part image change
  const handlePartImageChange = (
    files: UploadedFile | UploadedFile[] | undefined
  ) => {
    // For single image uploads, we expect either a single file or undefined
    const uploadedFile = Array.isArray(files) ? files[0] : files;
    form.setValue('partImageFile', uploadedFile);
    form.setValue('partImageId', uploadedFile?.id);
  };

  // Handle attached files change
  const handleAttachedFilesChange = (
    files: UploadedFile | UploadedFile[] | undefined
  ) => {
    // For multiple file uploads, we expect either an array or undefined
    const uploadedFiles = Array.isArray(files)
      ? files
      : files
        ? [files]
        : undefined;
    form.setValue('attachedFiles', uploadedFiles || []);
    form.setValue('fileIds', uploadedFiles?.map((f) => f.id) || []);
  };

  const handleBOMChange = (bomParts: CreatePartParams['bomParts']) => {
    form.setValue('bomParts', bomParts);
  };

  // Handle form submission
  const submitForm = async (data: FormData) => {
    try {
      // Prepare data for createPart function
      const createPartData: CreatePartParams = {
        name: data.name,
        partNumber: data.partNumber,
        partRevision: data.partRevision,
        description: data.description,
        unit: data.unit,
        trackingType: data.trackingType,
        partType: data.partType,
        partImageId: data.partImageId,
        fileIds: data.fileIds,
        bomParts: data.bomParts,
        nxFilePath: data.nxFilePath
      };

      const result = await createPart(createPartData);
      console.log(result);

      if (result.success && result.data) {
        toast.success('Part created successfully');
        router.push(`/parts/library/${result.data.id}`);
      } else {
        toast.error('Failed to create part');
      }
    } catch (error) {
      console.error('Error creating part:', error);
      toast.error('Failed to create part');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitForm)}
        className="flex flex-col h-full"
      >
        <div className="space-y-6">
          {/* Part Image and Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="partImageFile"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload
                        multiple={false}
                        accept={{
                          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
                        }}
                        value={field.value}
                        onChange={handlePartImageChange}
                        onUpload={handlePartImageUpload}
                        uploadPath="parts"
                        onError={(error) => toast.error(error)}
                        placeholder="Upload Part Image"
                        showPreview={true}
                        previewSize="md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter part name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="partNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Number</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input placeholder="Enter part number" {...field} />
                          <span>/</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partRevision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revision</FormLabel>
                      <FormControl>
                        <Input className="w-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter part description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Tracking Type */}
            <FormField
              control={form.control}
              name="trackingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tracking type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TrackingType.SERIAL}>
                        Serial
                      </SelectItem>
                      <SelectItem value={TrackingType.BATCH}>Batch</SelectItem>
                      <SelectItem value={TrackingType.LOT}>Lot</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit of Measure */}
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit of Measure (UOM)</FormLabel>
                  <FormControl>
                    <Input placeholder="EA, KG, M, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Part Type */}
            <FormField
              control={form.control}
              name="partType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select part type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PartType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatPartType(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* BOM Components Section */}
          <div className="space-y-2 my-4">
            <FormLabel>Bill of Materials (BOM)</FormLabel>
            <BOMPartsManager onChange={handleBOMChange} />
          </div>

          {/* Files Section */}
          <div className="space-y-2">
            <FormLabel>Files</FormLabel>
            <FormField
              control={form.control}
              name="attachedFiles"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUpload
                      multiple={true}
                      value={field.value}
                      onChange={handleAttachedFilesChange}
                      onUpload={handleFileUpload}
                      uploadPath="parts"
                      onError={(error) => toast.error(error)}
                      placeholder="Drop files here or click to browse"
                      showPreview={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex flex-grow flex-col justify-end pt-4">
          <div className="flex justify-end pt-4 mt-auto border-t -mx-4 px-4">
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={form.formState.isSubmitting}
              isLoading={form.formState.isSubmitting}
            >
              Create new part
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default NewPartForm;
