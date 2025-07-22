'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Prisma, TrackingType, PartType } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ImageInput } from '@/components/image-input';
import { Edit } from 'lucide-react';
import { updatePart } from '../../actions';

type PartWithAllNested = Prisma.PartGetPayload<{
  include: {
    partImage: true;
    files: true;
    basePartTo: true;
    bomParts: {
      include: {
        part: true;
      };
    };
    cadFile: true;
    gltfFile: true;
  };
}>;

type EditPartDialogProps = {
  part: PartWithAllNested;
  children?: React.ReactNode;
};

const editPartSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  trackingType: z.nativeEnum(TrackingType),
  partType: z.nativeEnum(PartType)
});

type EditPartFormData = z.infer<typeof editPartSchema>;

export const EditPartDialog = ({ part, children }: EditPartDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImageData, setNewImageData] =
    useState<Prisma.FileCreateInput | null>(null);
  const router = useRouter();

  const form = useForm<EditPartFormData>({
    resolver: zodResolver(editPartSchema),
    defaultValues: {
      name: part.name || '',
      partNumber: part.partNumber || '',
      description: part.description || '',
      unit: part.unit || 'EA',
      trackingType: part.trackingType,
      partType: part.partType
    }
  });

  const handleImageChange = (fileData: Prisma.FileCreateInput | null) => {
    setNewImageData(fileData);
  };

  const onSubmit = async (data: EditPartFormData) => {
    setIsSubmitting(true);

    try {
      let partImageData = null;

      // If a new image was uploaded, use its data
      if (newImageData) {
        partImageData = newImageData;
      }
      // If image was not removed and no new image, keep current image
      else if (part.partImage) {
        // Don't change the current image
        partImageData = undefined; // This will be handled in the updatePart action
      }
      // If image was removed, set to null
      else {
        partImageData = null;
      }

      const result = await updatePart({
        id: part.id,
        name: data.name,
        partNumber: data.partNumber,
        description: data.description,
        unit: data.unit,
        trackingType: data.trackingType,
        partType: data.partType,
        partImageData
      });

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        console.error('Failed to update part:', result.error);
      }
    } catch (error) {
      console.error('Error updating part:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon">
            <Edit className="w-4 h-4 mr-2" />
            {/* Edit */}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogDescription>
            Update the part information and image.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Part Image Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Part Image</h4>
              <ImageInput
                uploadPath="parts"
                onChange={handleImageChange}
                value={part.partImage?.key || null}
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Part name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Part number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Part description"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <FormControl>
                      <Input placeholder="EA, LBS, FT, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="SERIAL">Serial</SelectItem>
                        <SelectItem value="BATCH">Batch</SelectItem>
                        <SelectItem value="LOT">Lot</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="partType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part Type</FormLabel>
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
                      <SelectItem value="ASSEMBLY_400">Assembly</SelectItem>
                      <SelectItem value="MODULE_300">Module</SelectItem>
                      <SelectItem value="SUBASSEMBLY_200">
                        Subassembly
                      </SelectItem>
                      <SelectItem value="PART_100">Part</SelectItem>
                      <SelectItem value="RAW_000">Raw Material</SelectItem>
                      <SelectItem value="BIN">Bin</SelectItem>
                      <SelectItem value="SHIP">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
