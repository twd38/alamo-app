'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from 'src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from 'src/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';

interface BadgeQRDialogProps {
  /**
   * The user's access badge data
   */
  badgeId: string;
  /**
   * Optional className for the trigger button
   */
  className?: string;
}

/**
 * Dialog component that displays a QR code for the user's access badge
 */
export function BadgeQRDialog({ badgeId, className }: BadgeQRDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadQR = () => {
    if (!badgeId) return;

    // Create SVG element
    const svg = document.getElementById('badge-qr-code');
    if (!svg) return;

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create canvas and convert to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      // Download as PNG
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `badge-qr-${badgeId}.png`;
      downloadLink.click();

      // Cleanup
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleDialogContentClick = (e: React.MouseEvent) => {
    // Prevent clicks inside the dialog from bubbling up
    e.stopPropagation();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  if (!badgeId) {
    return (
      <Button variant="ghost" size="sm" className={className} disabled>
        <QrCode className="h-4 w-4 mr-2" />
        No Badge
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          onClick={handleTriggerClick}
          className={`${className} flex items-center w-full`}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Badge QR
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        onClick={handleDialogContentClick}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Access Badge QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access your badge information
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCode
              id="badge-qr-code"
              value={badgeId}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Badge ID:</p>
            <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {badgeId}
            </p>
          </div>
          <Button
            onClick={handleDownloadQR}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
