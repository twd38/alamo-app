"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Paperclip, File } from "lucide-react"
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { formatFileSize } from "@/lib/utils"
import { TrackingType, BOMType, Part } from "@prisma/client"
import { useRouter } from "next/navigation"
import BOMPartsManager from "./bom-parts-manager"
import { createPart } from "@/app/actions"

// Define the form schema using Zod
const formSchema = z.object({
  partNumber: z.string().optional(),
  description: z.string().min(1, { message: "Description is required" }),
  unit: z.string().min(1, { message: "Unit of measure is required" }),
  trackingType: z.nativeEnum(TrackingType),
  partImage: z.custom<File>((data) => {
    return data && 
      typeof data === 'object' && 
      'name' in data && 
      'size' in data && 
      'type' in data;
  }).optional(),
  isRawMaterial: z.boolean().default(false),
  files: z.array(
    z.custom<File>((data) => {
      return data && 
        typeof data === 'object' && 
        'name' in data && 
        'size' in data && 
        'type' in data;
    }, {
      message: "Must be a valid file"
    })
  ).default([]),
  bomParts: z.array(
    z.object({
      id: z.string(),
      part: z.any() as z.ZodType<Part>, 
      qty: z.number().min(1),
      bomType: z.nativeEnum(BOMType)
    })
  ).default([])
})



const NewPartForm = () => {
  const router = useRouter();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      unit: "",
      trackingType: TrackingType.SERIAL,
      files: [],
      bomParts: [],
      isRawMaterial: false
    }
  });

  // Handle form submission
  const submitForm = async (data: z.infer<typeof formSchema>) => {
    try {
      const result = await createPart(data);
      console.log(result)
      if (result.success && result.data) {
        toast.success("Part created successfully");
        router.push(`/parts/library/${result.data.partNumber}`);
      } else {
        toast.error("Failed to create part");
      }
      
    } catch (error) {
      console.error("Error creating part:", error);
      toast.error("Failed to create part");
    }
  };

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitForm)} className="flex flex-col  h-full">
            <div className="px-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                          <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                              <Input placeholder="Enter description" {...field} />
                          </FormControl>
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
                              <SelectItem value={TrackingType.SERIAL}>Serial</SelectItem>
                              <SelectItem value={TrackingType.BATCH}>Batch</SelectItem>
                              <SelectItem value={TrackingType.LOT}>Lot</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                </div>

                {/* Is raw material */}
                <FormField
                    control={form.control}
                    name="isRawMaterial"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">Is Raw Material?</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                    )}
                />  
                

                {/* Files Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Files</h3>
                    <FormField
                        control={form.control}
                        name="files"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <div className="flex items-center gap-2">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 bg-secondary"
                                    onClick={() => {
                                    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                                    fileInput.click();
                                    }}
                                >
                                    <Paperclip className="h-4 w-4" />
                                    Attach Files
                                </Button>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    const currentFiles = field.value;
                                    
                                    // Validate file size (10MB limit)
                                    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
                                    if (invalidFiles.length > 0) {
                                        toast.error('Files must be less than 10MB');
                                        return;
                                    }
                                    
                                    field.onChange([...currentFiles, ...files]);
                                    }}
                                />
                                </label>
                            </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>

                    {/* File List */}
                    {form.watch('files').length > 0 && (
                    <div className="border rounded-md px-2">
                        <div className="space-y-2">
                        {form.watch('files').map((file: File, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md">
                            <div className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                const currentFiles = form.getValues('files');
                                const updatedFiles = currentFiles.filter((_, i) => i !== index);
                                form.setValue('files', updatedFiles);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}
                </div>

                {/* BOM Components Section */}
                <BOMPartsManager form={form} />
                
            </div>
            <div className="flex flex-grow flex-col justify-end">
                <div className="flex justify-end border-t px-4 pb-1 pt-3 w-full mt-auto">
                    <Button 
                        type="submit"
                        variant="default" 
                        size="sm" 
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
