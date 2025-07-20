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
import {
  TrackingType,
  BOMType,
  Part,
  PartType,
  File as PrismaFile,
  Prisma
} from '@prisma/client';
import { useRouter } from 'next/navigation';
import { BOMPartsManager } from './bom-parts-manager';
import { createPart } from '../actions/createPart';
import { createFile, deleteFile } from '@/lib/actions/file-actions';
import { formatPartType } from '@/lib/utils';
import { FileList } from '@/components/files/file-list';

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
  partImageFile: z.custom<PrismaFile>().optional(),
  attachedFiles: z.array(z.custom<PrismaFile>()).optional()
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

  // Handle part image upload - create database records
  const handlePartImageUpload = async (
    fileInputs: Prisma.FileCreateInput[]
  ) => {
    try {
      const createdFiles = await Promise.all(
        fileInputs.map((fileInput) => createFile(fileInput as PrismaFile))
      );

      // For part image, we only expect one file
      if (createdFiles.length > 0) {
        const createdFile = createdFiles[0];
        form.setValue('partImageFile', createdFile);
        form.setValue('partImageId', createdFile.id);
      }
    } catch (error) {
      console.error('Error creating part image file record:', error);
      toast.error('Failed to upload part image');
    }
  };

  // Handle attached files upload - create database records
  const handleAttachedFilesUpload = async (
    fileInputs: Prisma.FileCreateInput[]
  ) => {
    try {
      const createdFiles = await Promise.all(
        fileInputs.map((fileInput) => createFile(fileInput as PrismaFile))
      );

      // Add to existing attached files
      const currentFiles = form.getValues('attachedFiles') || [];
      const updatedFiles = [...currentFiles, ...createdFiles];

      form.setValue('attachedFiles', updatedFiles);
      form.setValue(
        'fileIds',
        updatedFiles.map((f) => f.id)
      );
    } catch (error) {
      console.error('Error creating attached file records:', error);
      toast.error('Failed to upload files');
    }
  };

  // Handle file deletion for attached files
  const handleAttachedFileDelete = async (file: PrismaFile) => {
    try {
      // Delete the file record from the database
      const deleteResult = await deleteFile(file.id);

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete file');
      }

      // Remove from form state
      const currentFiles = form.getValues('attachedFiles') || [];
      const updatedFiles = currentFiles.filter((f) => f.id !== file.id);

      form.setValue('attachedFiles', updatedFiles);
      form.setValue(
        'fileIds',
        updatedFiles.map((f) => f.id)
      );

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  // Handle part image deletion
  const handlePartImageDelete = async (file: PrismaFile) => {
    try {
      // Delete the file record from the database
      const deleteResult = await deleteFile(file.id);

      if (!deleteResult.success) {
        throw new Error(deleteResult.error || 'Failed to delete file');
      }

      form.setValue('partImageFile', undefined);
      form.setValue('partImageId', undefined);

      toast.success('Part image deleted successfully');
    } catch (error) {
      console.error('Error removing part image:', error);
      toast.error('Failed to remove part image');
    }
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
                      <FileList
                        files={field.value ? [field.value] : []}
                        uploadPath="parts"
                        onUpload={handlePartImageUpload}
                        onDelete={handlePartImageDelete}
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
                    <FileList
                      files={field.value || []}
                      uploadPath="parts"
                      onUpload={handleAttachedFilesUpload}
                      onDelete={handleAttachedFileDelete}
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
