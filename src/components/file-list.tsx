"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, X } from "lucide-react";
import { File } from "lucide-react";
import toast from "react-hot-toast";
import { formatFileSize } from "@/lib/utils";

interface FileListProps {
    files: FileType[] | [];
    onChange: (files: FileType[]) => void;
}

type FileType = {
    id?: string;
    name: string;
    size: number;
    url?: string;
}

const FileList = ({ files, onChange }: FileListProps) => {
    return(
        <div className="space-y-4">
            <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Files</h3>
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
                        const addedFiles = Array.from(e.target.files || []);
                        const currentFiles = files;
                        
                        // Validate file size (10MB limit)
                        const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
                        if (invalidFiles.length > 0) {
                            toast.error('Files must be less than 10MB');
                            return;
                        }

                        console.log("currentFiles", currentFiles);
                        console.log("addedFiles", addedFiles);
                        
                        onChange([...currentFiles, ...addedFiles]);
                        }}
                    />
                    </label>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
            <div className="border rounded-md px-2">
                <div className="space-y-2">
                {files.map((file: FileType, index: number) => (
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
                            const currentFiles = files;
                            const updatedFiles = currentFiles.filter((_, i) => i !== index);
                            onChange(updatedFiles);
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
    )
}

export default FileList;