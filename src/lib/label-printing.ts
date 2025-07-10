/**
 * ZPL Label Generation and Printing Utilities
 * For Zebra ZD420 and compatible printers
 */

export interface PartLabelData {
  workOrderNumber: string;
  partNumber: string;
  partName?: string;
  quantity?: number;
  dueDate?: string;
}

/**
 * Generates ZPL code for a part label
 * Designed for 2" x 1" labels (typical for part labeling)
 */
export function generatePartLabelZPL(data: PartLabelData): string {
  const { workOrderNumber, partNumber, partName, quantity, dueDate } = data;

  // ZPL template for part label (2" x 1" - 203x102 dots at 203 DPI)
  const zpl = `
^XA
^CF0,30
^FO20,15^FDWORK ORDER:^FS
^CF0,25
^FO20,45^FD${workOrderNumber}^FS

^CF0,30
^FO20,80^FDPART NUMBER:^FS
^CF0,25
^FO20,110^FD${partNumber}^FS

${partName ? `^CF0,20^FO20,140^FD${partName.substring(0, 25)}^FS` : ''}

${quantity ? `^CF0,18^FO150,15^FDQTY: ${quantity}^FS` : ''}

${dueDate ? `^CF0,18^FO150,35^FDDUE: ${dueDate}^FS` : ''}

^XZ
`.trim();

  return zpl;
}

/**
 * Prints a ZPL label using the browser's print functionality
 * This creates a printable document that should work with Zebra printers
 */
export async function printZPLLabel(zplCode: string): Promise<void> {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=300');

    if (!printWindow) {
      throw new Error(
        'Unable to open print window. Please check pop-up settings.'
      );
    }

    // Create HTML content with ZPL in a pre-formatted block
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zebra Label</title>
          <style>
            body {
              margin: 0;
              padding: 10px;
              font-family: monospace;
              font-size: 12px;
            }
            .zpl-content {
              white-space: pre-wrap;
              word-break: break-all;
              border: 1px solid #ccc;
              padding: 10px;
              background-color: #f9f9f9;
            }
            .label-preview {
              margin-bottom: 20px;
              padding: 10px;
              border: 2px solid #333;
              width: 2in;
              height: 1in;
              font-size: 8px;
              position: relative;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
              .zpl-content { 
                font-size: 10px;
                border: none;
                background: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <h3>Zebra Label - Send this to your ZD420 printer</h3>
            <p>Make sure your Zebra printer is set as the default printer, then click Print.</p>
          </div>
          <div class="zpl-content">${zplCode}</div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait a moment for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  } catch (error) {
    console.error('Error printing label:', error);
    throw error;
  }
}

/**
 * Alternative printing method using direct ZPL sending
 * This requires the printer to be accessible via network or special drivers
 */
export async function sendZPLToPrinter(
  zplCode: string,
  printerIP?: string
): Promise<void> {
  if (printerIP) {
    try {
      // This would require a backend endpoint to handle ZPL printing
      const response = await fetch('/api/print-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          zpl: zplCode,
          printerIP: printerIP
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send label to printer');
      }
    } catch (error) {
      console.error('Error sending ZPL to printer:', error);
      throw error;
    }
  } else {
    // Fallback to browser printing
    await printZPLLabel(zplCode);
  }
}

/**
 * Creates a downloadable ZPL file
 * Useful for manual printing or testing
 */
export function downloadZPLFile(
  zplCode: string,
  filename: string = 'label.zpl'
): void {
  const blob = new Blob([zplCode], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
