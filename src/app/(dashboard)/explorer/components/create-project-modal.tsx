'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MapPin, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { createProject } from '../actions/create-project';
import type { ParcelDetail, FloodZoneData } from '../queries';
import type { HeadlineMetricsData } from './headline-metrics';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less')
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: ParcelDetail | null;
  floodZone: FloodZoneData | null;
  headlineMetrics: HeadlineMetricsData | null;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  parcel,
  floodZone,
  headlineMetrics
}: CreateProjectModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate default project name from address
  const defaultName = parcel?.streetAddress?.address || 'New Project';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultName
    }
  });

  // Reset form when modal opens with new parcel
  const handleOpenChange = (open: boolean) => {
    if (open) {
      form.reset({ name: defaultName });
    }
    onOpenChange(open);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      const result = await createProject({
        name: data.name,
        parcelNumber: parcel?.parcelNumber || null,
        address: parcel?.streetAddress?.address || null,
        lotAreaSqFt: parcel?.dimensions?.gisSqft || null,
        zoningCode: parcel?.zoningData?.zoning || null,
        floodZone: floodZone?.floodZone || null,
        latitude: parcel?.latitude || null,
        longitude: parcel?.longitude || null,
        maxUnits: headlineMetrics?.maxUnits || null,
        buildableArea: headlineMetrics?.buildableArea || null,
        estimatedValue: headlineMetrics?.estimatedValue || null,
        landCost: parcel?.appraisal?.parcelValue || null
      });

      if (result.success && result.data) {
        toast.success('Project created successfully');
        onOpenChange(false);

        // Navigate to the project's build options page
        // For now, navigate to a placeholder route since PRD-02 isn't built yet
        router.push(`/projects/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format numbers for display
  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '---';
    return value.toLocaleString();
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '---';
    return `$${value.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create Development Project
          </DialogTitle>
          <DialogDescription>
            Create a new development project from this site analysis.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter project name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Site Summary */}
            <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Site Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Address</p>
                  <p className="font-medium truncate">
                    {parcel?.streetAddress?.address || '---'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Lot Size</p>
                  <p className="font-medium">
                    {formatNumber(parcel?.dimensions?.gisSqft)} ft²
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Zoning</p>
                  <p className="font-medium">{parcel?.zoningData?.zoning || '---'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Max Units</p>
                  <p className="font-medium">
                    {formatNumber(headlineMetrics?.maxUnits)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Land Cost</p>
                  <p className="font-medium">
                    {formatCurrency(parcel?.appraisal?.parcelValue)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Flood Zone</p>
                  <p className="font-medium">
                    {floodZone?.floodZone || 'Not mapped'}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
