"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Paperclip, File, Search, Trash2 } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "react-hot-toast"
import { formatFileSize } from "@/lib/utils"
import { Part, TrackingType, BOMType } from "@prisma/client"
import { getParts } from '@/lib/queries'
import { useRouter } from "next/navigation"

// Define the form schema using Zod
const formSchema = z.object({
  description: z.string().min(1, { message: "Description is required" }),
  unit: z.string().min(1, { message: "Unit of measure is required" }),
  trackingType: z.nativeEnum(TrackingType),
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
  ).default([])
})

// Interface for BOM component items
interface BOMComponentItem {
  componentPartId: string;
  componentPart: Part;
  quantityPer: number;
  bomType: BOMType;
}

const NewPartForm = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Part[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bomComponents, setBomComponents] = useState<BOMComponentItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      unit: "EA",
      trackingType: TrackingType.SERIAL,
      files: []
    }
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && showSearchResults) {
      void searchParts();
    }
  }, [debouncedQuery, showSearchResults]);

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container') && !target.closest('.search-results')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle form submission
  const submitForm = async (data: z.infer<typeof formSchema>) => {
    try {
      // Create a FormData object to handle file uploads
      const formData = new FormData();
      
      // Add form fields to FormData
      formData.append("description", data.description);
      formData.append("unit", data.unit);
      formData.append("trackingType", data.trackingType);
      
      // Add BOM components as JSON string
      formData.append("bomComponents", JSON.stringify(bomComponents));
      
      // Add files if any
      if (data.files.length > 0) {
        data.files.forEach((file, index) => {
          formData.append(`file-${index}`, file);
        });
      }
      
      // TODO: Replace with actual server action when implemented
      // const result = await createPart(formData);
      
      toast.success("Part created successfully");
      router.push("/parts/library");
      
    } catch (error) {
      console.error("Error creating part:", error);
      toast.error("Failed to create part");
    }
  };

  // Search for parts
  const searchParts = async () => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await getParts({
        query: debouncedQuery,
        page: 1,
        limit: 10,
        sortBy: "partNumber",
        sortOrder: "asc"
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching parts:", error);
      toast.error("Failed to search parts");
    } finally {
      setIsSearching(false);
    }
  };

  // Add part to BOM
  const addPartToBOM = (part: Part) => {
    // Check if part already exists in BOM
    const exists = bomComponents.some(item => item.componentPartId === part.id);
    if (exists) {
      toast.error("Part already added to BOM");
      return;
    }
    
    // Add part to BOM with default quantity of 1
    setBomComponents([
      ...bomComponents,
      {
        componentPartId: part.id,
        componentPart: part,
        quantityPer: 1,
        bomType: BOMType.MANUFACTURING
      }
    ]);
    
    // Clear search
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Update BOM component quantity
  const updateComponentQuantity = (index: number, quantity: number) => {
    const updatedComponents = [...bomComponents];
    updatedComponents[index].quantityPer = quantity;
    setBomComponents(updatedComponents);
  };

  // Update BOM component type
  const updateComponentType = (index: number, bomType: BOMType) => {
    const updatedComponents = [...bomComponents];
    updatedComponents[index].bomType = bomType;
    setBomComponents(updatedComponents);
  };

  // Remove part from BOM
  const removePartFromBOM = (index: number) => {
    const updatedComponents = bomComponents.filter((_, i) => i !== index);
    setBomComponents(updatedComponents);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitForm)} className="space-y-6">
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
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Bill of Materials (BOM)</h3>
              </div>
              
              {/* Inline Search Component */}
              <div className="relative search-container">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search for parts by name or number"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSearchResults(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          searchParts();
                        }
                      }}
                      className="pr-8"
                    />
                    {searchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && (searchResults.length > 0 || isSearching || searchQuery) && (
                  <div className="absolute z-10 mt-1 w-full bg-popover shadow-md rounded-md border overflow-hidden search-results">
                    {isSearching ? (
                      <div className="text-center py-4">
                        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                        <p className="mt-1 text-xs text-muted-foreground">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-60 overflow-auto">
                        {searchResults.map((part) => {
                          const isAlreadyAdded = bomComponents.some(
                            item => item.componentPartId === part.id
                          );
                          
                          return (
                            <div 
                              key={part.id} 
                              className={`flex items-center justify-between p-2 hover:bg-accent cursor-pointer ${isAlreadyAdded ? "bg-muted/50" : ""}`}
                              onClick={() => {
                                if (!isAlreadyAdded) {
                                  addPartToBOM(part);
                                }
                              }}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{part.description}</span>
                                  {/* <span className="text-xs text-muted-foreground">{part.partNumber}</span> */}
                                </div>
                                <span className="text-sm text-muted-foreground truncate max-w-xs">{part.partNumber}</span>
                              </div>
                              {isAlreadyAdded ? (
                                <span className="text-xs text-muted-foreground px-2">Added</span>
                              ) : (
                                <Plus className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : searchQuery ? (
                      <div className="text-center py-3 text-sm text-muted-foreground">
                        No parts found
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-muted-foreground">
                        Enter a search term to find parts
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BOM Components Table */}
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bomComponents.length > 0 ? (
                    bomComponents.map((component, index) => (
                      <TableRow key={component.componentPartId}>
                        <TableCell className="flex flex-col">
                            {component.componentPart.description}
                            <span className="text-xs text-muted-foreground">{component.componentPart.partNumber}</span>
                        </TableCell>
                        <TableCell>{component.componentPart.unit}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={component.quantityPer}
                            onChange={(e) => updateComponentQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePartFromBOM(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No components added. Use the search above to add components.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewPartForm;
