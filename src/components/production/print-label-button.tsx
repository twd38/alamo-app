'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Printer, Download, ChevronDown } from 'lucide-react';
import {
  generatePartLabelZPL,
  printZPLLabel,
  downloadZPLFile,
  type PartLabelData
} from '@/lib/label-printing';
import { useState } from 'react';
import { toast } from 'sonner';

interface PrintLabelButtonProps {
  workOrderNumber: string;
  partNumber: string;
  partName?: string;
  quantity?: number;
  dueDate?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function PrintLabelButton({
  workOrderNumber,
  partNumber,
  partName,
  quantity,
  dueDate,
  variant = 'outline',
  size = 'default',
  className
}: PrintLabelButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const labelData: PartLabelData = {
    workOrderNumber,
    partNumber,
    partName,
    quantity,
    dueDate
  };

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      const zplCode = generatePartLabelZPL(labelData);
      await printZPLLabel(zplCode);
      toast.success('Label sent to printer');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print label. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      const zplCode = generatePartLabelZPL(labelData);
      const filename = `${workOrderNumber}_${partNumber}_label.zpl`;
      downloadZPLFile(zplCode, filename);
      toast.success('Label file downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label file');
    }
  };

  const handlePreview = () => {
    try {
      const zplCode = generatePartLabelZPL(labelData);

      // Create a preview window
      const previewWindow = window.open('', '_blank', 'width=500,height=400');

      if (!previewWindow) {
        toast.error('Unable to open preview. Please check pop-up settings.');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Label Preview</title>
            <style>
              body {
                margin: 20px;
                font-family: Arial, sans-serif;
              }
              .label-preview {
                border: 2px solid #333;
                width: 2in;
                height: 1in;
                padding: 8px;
                margin-bottom: 20px;
                font-size: 10px;
                background: white;
                position: relative;
              }
              .work-order { font-weight: bold; margin-bottom: 4px; }
              .part-number { font-weight: bold; margin-bottom: 2px; }
              .part-name { font-size: 8px; margin-bottom: 2px; }
              .metadata { position: absolute; top: 8px; right: 8px; font-size: 8px; text-align: right; }
              .zpl-code {
                background: #f5f5f5;
                padding: 10px;
                border: 1px solid #ddd;
                font-family: monospace;
                white-space: pre-wrap;
                font-size: 10px;
              }
            </style>
          </head>
          <body>
            <h3>Label Preview</h3>
            <div class="label-preview">
              <div class="metadata">
                ${quantity ? `QTY: ${quantity}<br>` : ''}
                ${dueDate ? `DUE: ${dueDate}` : ''}
              </div>
              <div class="work-order">WORK ORDER:<br>${workOrderNumber}</div>
              <div class="part-number">PART NUMBER:<br>${partNumber}</div>
              ${partName ? `<div class="part-name">${partName}</div>` : ''}
            </div>
            <h4>ZPL Code:</h4>
            <div class="zpl-code">${zplCode}</div>
          </body>
        </html>
      `;

      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
      toast.success('Label preview opened');
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to open preview');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoading}
        >
          <Printer className="h-4 w-4 mr-2" />
          {isLoading ? 'Printing...' : 'Print Label'}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePrint} disabled={isLoading}>
          <Printer className="h-4 w-4 mr-2" />
          Print to Zebra Printer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePreview}>
          <Printer className="h-4 w-4 mr-2" />
          Preview Label
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download ZPL File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
