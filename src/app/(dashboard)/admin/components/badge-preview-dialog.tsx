'use client';

import { useRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { AccessBadgeWithRelations } from '@/lib/queries';
import Image from 'next/image';

interface BadgePreviewDialogProps {
  badge: AccessBadgeWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgePreviewDialog({
  badge,
  isOpen,
  onClose
}: BadgePreviewDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [bottomText, setBottomText] = useState<string>('Alamo');

  useEffect(() => {
    if (badge && isOpen) {
      // Generate QR code with just the badge ID
      const qrData = encodeURIComponent(badge.id);
      setQrCodeUrl(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`
      );
    }
  }, [badge, isOpen]);

  const renderBadge = (side: 'front' | 'back') => {
    if (!badge) return null;

    const badgeStyle =
      'w-[2in] h-[3in] bg-white rounded-lg shadow-lg border border-gray-200 relative overflow-hidden';

    if (side === 'front') {
      return (
        <div className={badgeStyle}>
          {/* Header with logo and company name */}
          <div className="flex items-start p-4">
            <Image
              src="/images/ahc-logo.png"
              alt="AHC Logo"
              width={80}
              height={80}
            />
          </div>

          {/* User info */}
          <div className="absolute bottom-16 left-4 w-[1.7in] truncate">
            <h2 className="text-lg font-bold text-gray-900">
              {badge.user?.name}
            </h2>
            {/* <p className="text-sm text-gray-600 mt-1">Co-Founder</p> */}
            <p className="text-[0.7rem] text-gray-500">{badge.user?.email}</p>
          </div>

          {/* Alamo branding */}
          <div className="absolute bottom-0 left-0 right-0 bg-black text-white py-3 px-4">
            <span className="text-sm font-bold">{bottomText}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className={badgeStyle}>
          {/* QR Code centered */}
          <div className="flex items-center justify-center h-full">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-[1in] h-[1in]" />
            )}
          </div>
        </div>
      );
    }
  };

  const generatePrintableHTML = (): string => {
    if (!badge || !qrCodeUrl) return '';

    // Generate QR code with just the badge ID for printing
    const qrData = encodeURIComponent(badge.id);
    const printQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${qrData}`;

    // Determine email length category for responsive sizing
    const getEmailLengthCategory = (email: string) => {
      const length = email.length;
      if (length <= 20) return 'short';
      if (length <= 30) return 'medium';
      if (length <= 40) return 'long';
      return 'very-long';
    };

    const emailLengthCategory = getEmailLengthCategory(badge.user?.email || '');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Badge Print - ${badge.user?.name}</title>
          <style>
            @page {
              size: 55mm 86mm;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              /* Force background colors to print */
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
            }
            
            .badge-page {
              width: 55mm;
              height: 86mm;
              page-break-after: always;
              padding: 0;
              margin: 0;
            }
            
            .badge-page:last-child {
              page-break-after: auto;
            }
            
            .badge {
              width: 55mm;
              height: 86mm;
              background: white;
              position: relative;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            
            .badge-front .header {
              padding: 4mm;
              flex-shrink: 0;
            }
            
            .badge-front .logo {
              margin-top: 3mm;
              width: 24mm;
              height: auto;
            }
            
            .badge-front .user-info {
              position: absolute;
              bottom: 18mm;
              left: 4mm;
              right: 4mm;
            }
            
            .badge-front .user-name {
              font-size: 5mm;
              font-weight: bold;
              color: black;
              margin-bottom: 1mm;
              line-height: 1.2;
            }
            
            .badge-front .user-title {
              font-size: 5mm;
              color: black;
              margin-bottom: 0mm;
              display: none; /* Commented out in React version */
            }
            
            .badge-front .user-email {
              font-size: 3mm;
              color: black;
              line-height: 1.2;
              word-break: break-all;
              overflow-wrap: break-word;
              max-width: 100%;
              display: block;
            }
            
            /* Auto-scale email for different lengths */
            .badge-front .user-email[data-length="short"] {
              font-size: 3mm;
            }
            
            .badge-front .user-email[data-length="medium"] {
              font-size: 2.5mm;
            }
            
            .badge-front .user-email[data-length="long"] {
              font-size: 2mm;
              line-height: 1.1;
            }
            
            .badge-front .user-email[data-length="very-long"] {
              font-size: 1.8mm;
              line-height: 1.0;
              word-break: break-all;
            }
            
            @media print {
              .badge-front .user-email {
                font-size: clamp(1.6mm, 2.5vw, 3mm);
              }
            }
            
            .badge-front .bottom-bar {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              width: 100%;
              background: black;
              color: white;
              padding: 5mm 4mm;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: flex-start;
            }
            
            .badge-front .bottom-text {
              font-size: 4mm;
              font-weight: bold;
              text-align: left;
            }
           
            .badge-back {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100%;
            }
            
            .badge-back .qr-code {
              width: 25mm;
              height: 25mm;
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .badge-page {
                width: 55mm;
                height: 86mm;
                padding: 0;
                margin: 0;
              }
              
              .badge {
                width: 55mm;
                height: 86mm;
              }
            }
          </style>
        </head>
        <body>
          <!-- Front side page -->
          <div class="badge-page">
            <div class="badge badge-front">
              <div class="header">
                <img src="/images/ahc-logo.png" alt="AHC Logo" class="logo" />
              </div>
              <div class="user-info">
                <div class="user-name">${badge.user?.name || 'Unknown'}</div>
                <div class="user-title">Co-Founder</div>
                <div class="user-email" data-length="${emailLengthCategory}">${badge.user?.email || ''}</div>
              </div>
              <div class="bottom-bar">
                <span class="bottom-text">${bottomText}</span>
              </div>
            </div>
          </div>
          
          <!-- Back side page -->
          <div class="badge-page">
            <div class="badge badge-back">
              <img src="${printQrUrl}" alt="QR Code" class="qr-code" />
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDirectPrint = () => {
    if (!badge || !printRef.current) return;

    // Create a new window with just the badge content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printHTML = generatePrintableHTML();

    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for images to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  if (!badge) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Badge Preview - {badge.user?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Badge previews */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Front</h3>
                {renderBadge('front')}
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Back</h3>
                {renderBadge('back')}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDirectPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Badge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden printable content */}
      <div ref={printRef} className="hidden">
        {/* This will be used for direct printing if needed */}
      </div>
    </>
  );
}
