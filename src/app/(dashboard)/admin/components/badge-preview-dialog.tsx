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
    const printQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${qrData}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Badge Print - ${badge.user?.name}</title>
          <style>
            @page {
              size: A4;
              margin: 0.5in;
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
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              padding: 20px;
            }
            
            .badge-container {
              display: flex;
              gap: 20px;
              justify-content: center;
            }
            
            .badge {
              width: 2in;
              height: 3in;
              background: white;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              position: relative;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .badge-front .header {
              padding: 16px;
            }
            
                         .badge-front .logo {
               width: 80px;
               height: auto;
             }
             
             .badge-front .user-info {
               position: absolute;
               bottom: 64px;
               left: 16px;
               width: 1.7in;
               white-space: nowrap;
               overflow: hidden;
               text-overflow: ellipsis;
             }
             
             .badge-front .user-name {
               font-size: 18px;
               font-weight: bold;
               color: #111827;
               margin-bottom: 4px;
               white-space: nowrap;
               overflow: hidden;
               text-overflow: ellipsis;
             }
             
             .badge-front .user-title {
               font-size: 14px;
               color: #6b7280;
               margin-bottom: 8px;
               display: none; /* Commented out in React version */
             }
             
             .badge-front .user-email {
               font-size: 11.2px; /* 0.7rem equivalent */
               color: #9ca3af;
               white-space: nowrap;
               overflow: hidden;
               text-overflow: ellipsis;
             }
             
             .badge-front .bottom-bar {
               position: absolute;
               bottom: 0;
               left: 0;
               right: 0;
               background: black;
               color: white;
               padding: 12px 16px;
             }
             
             .badge-front .bottom-text {
               font-size: 14px;
               font-weight: bold;
             }
            
            .badge-back {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .badge-back .qr-code {
              width: 1in;
              height: 1in;
            }
            
            .badge-label {
              text-align: center;
              margin-bottom: 8px;
              font-weight: 600;
              color: #374151;
            }

            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
              
              .badge-container {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="badge-container">
            <div>
              <div class="badge-label">Front</div>
              <div class="badge badge-front">
                <div class="header">
                  <img src="/images/ahc-logo.png" alt="AHC Logo" class="logo" />
                </div>
                <div class="user-info">
                  <div class="user-name">${badge.user?.name || 'Unknown'}</div>
                  <div class="user-title">Co-Founder</div>
                  <div class="user-email">${badge.user?.email || ''}</div>
                </div>
                <div class="bottom-bar">
                  <span class="bottom-text">${bottomText}</span>
                </div>
              </div>
            </div>
            
            <div>
              <div class="badge-label">Back</div>
              <div class="badge badge-back">
                <img src="${printQrUrl}" alt="QR Code" class="qr-code" />
              </div>
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
