/**
 * ZPL Label Generation and Printing Utilities
 * For Zebra printers via Zebra Cloud API
 */

export interface PartLabelData {
  workOrderNumber: string;
  partNumber: string;
  partName?: string;
  quantity?: number;
  dueDate?: string;
  workOrderId?: string;
  baseUrl?: string;
}

/**
 * Generates ZPL code for a part label with QR code
 * Designed for 2.25" x 1.25" labels (457x254 dots at 203 DPI)
 * Includes: Work Order Number, Part Number, Part Name (optional), and QR Code
 */
export function generatePartLabelZPL(data: PartLabelData): string {
  const {
    workOrderNumber,
    partNumber,
    partName,
    quantity,
    dueDate,
    workOrderId,
    baseUrl
  } = data;

  // Generate QR code URL if workOrderId is provided
  const qrCodeUrl =
    workOrderId && baseUrl ? `${baseUrl}/production/${workOrderId}` : null;

  // ZPL template for part label (2.25" x 1.25" - 457x254 dots at 203 DPI)
  const zpl = `
^XA
^CF0,35
^FO25,55^FD${workOrderNumber}^FS

^CF0,35
^FO25,100^FDPN-${partNumber}^FS

${partName ? `^CF0,22^FO25,180^FD${partName.substring(0, 30)}^FS` : ''}

${
  qrCodeUrl
    ? `
^FO280,30^BQN,2,3
^FDQA,${qrCodeUrl}^FS`
    : ''
}

^XZ
`.trim();

  return zpl;
}

/**
 * Sends ZPL to Zebra printer using Zebra Cloud API
 * Uses the SendFileToPrinter API endpoint
 */
export async function sendZPLToPrinter(
  zplCode: string,
  printerSerialNumber: string = 'D2J185007015'
): Promise<void> {
  const apiKey = process.env.ZEBRA_API_KEY;
  const tenant = process.env.ZEBRA_TENANT;

  if (!apiKey || !tenant) {
    throw new Error(
      'Zebra API credentials not configured. Set ZEBRA_API_KEY and ZEBRA_TENANT environment variables.'
    );
  }

  const baseUrl = 'https://api.zebra.com/v2/devices/printers';
  const endpoint = `${baseUrl}/send`;

  try {
    // Create FormData with ZPL file
    const formData = new FormData();

    // Add the serial number
    formData.append('sn', printerSerialNumber);

    // Create a blob from the ZPL code and add it as a file
    const zplBlob = new Blob([zplCode], { type: 'text/plain' });
    formData.append('zpl_file', zplBlob, 'label.zpl');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        tenant
        // Don't set Content-Type header - let fetch set it for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(
        `Zebra Cloud API request failed: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result = await response.json().catch(() => ({}));
    return result;
  } catch (error) {
    console.error('Failed to send ZPL via Zebra Cloud API:', error);
    throw new Error(
      `Failed to send label to printer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Test printer connectivity via Zebra Cloud API
 * Sends a simple test ZPL to verify the printer is reachable
 */
export async function testPrinterConnection(
  printerSerialNumber: string = 'D2J185007015'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Generate a simple test ZPL
    const testZPL = `
^XA
^CF0,30
^FO50,50^FDZebra Cloud API Test^FS
^FO50,100^FD${new Date().toLocaleString()}^FS
^XZ
`.trim();

    await sendZPLToPrinter(testZPL, printerSerialNumber);

    return {
      success: true,
      message: `Test label sent successfully to printer ${printerSerialNumber} via Zebra Cloud API`
    };
  } catch (error) {
    console.error('Printer test failed:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during printer test'
    };
  }
}
