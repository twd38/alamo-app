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
 * Sends ZPL directly to Zebra printer using multiple methods
 * Tries various approaches to mimic netcat-like raw data sending
 */
export async function sendZPLToPrinter(
  zplCode: string,
  printerIP: string = '192.168.1.148'
): Promise<void> {
  const methods = [
    () => sendViaRawPort9100(zplCode, printerIP)
    // () => sendViaZebraWebInterface(zplCode, printerIP),
    // () => sendViaAlternativeEndpoints(zplCode, printerIP),
    // () => sendViaWebSocket(zplCode, printerIP)
  ];

  let lastError: Error | null = null;

  for (const method of methods) {
    try {
      await method();
      console.log('Successfully sent ZPL to printer');
      return;
    } catch (error) {
      console.error('Method failed:', error);
      lastError = error as Error;
    }
  }

  throw new Error(
    `All printing methods failed. Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Method 1: Send raw ZPL to port 9100 (like netcat)
 * Mimics: nc 192.168.1.148 9100 < [file]
 * This sends raw ZPL data directly to port 9100 without HTTP headers
 */
async function sendViaRawPort9100(
  zplCode: string,
  printerIP: string
): Promise<void> {
  console.log('Attempting raw port 9100 method (netcat-like)...');

  try {
    // This is the closest we can get to raw TCP in a browser
    // Send raw ZPL data directly to port 9100 with minimal HTTP overhead
    const response = await fetch(`http://${printerIP}:9100`, {
      method: 'POST',
      headers: {
        // No Content-Type header to make it as raw as possible
        'Content-Length': zplCode.length.toString()
      },
      body: zplCode,
      mode: 'no-cors', // Bypass CORS for local network
      cache: 'no-cache',
      redirect: 'manual' // Don't follow redirects
    });

    console.log('Successfully sent raw ZPL to port 9100');
    return;
  } catch (error) {
    console.log('Failed to send raw ZPL to port 9100:', error);
  }

  // Fallback: Try with even simpler approach
  try {
    console.log('Trying simplified raw approach...');

    // Even simpler - just send the ZPL as plain text
    const response = await fetch(`http://${printerIP}:9100`, {
      method: 'POST',
      body: zplCode,
      mode: 'no-cors'
    });

    console.log('Successfully sent via simplified raw method');
    return;
  } catch (error) {
    console.log('Simplified raw method also failed:', error);
  }

  throw new Error(
    'Raw port 9100 method failed - printer may not accept HTTP on port 9100'
  );
}

/**
 * Method 2: Zebra's standard web interface
 */
async function sendViaZebraWebInterface(
  zplCode: string,
  printerIP: string
): Promise<void> {
  console.log('Attempting Zebra web interface method...');

  const endpoints = ['/pstprnt', '/printer/zpl', '/zpl', '/print'];

  try {
    const url = `http://${printerIP}`;

    // Try form-encoded data
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `prnstr=${encodeURIComponent(zplCode)}`,
      mode: 'no-cors'
    });

    console.log(`Successfully sent via ${url}`);
    return;
  } catch (error) {
    console.log(`Failed to send print label:`, error);
  }
  throw new Error('Zebra web interface method failed');
}

/**
 * Method 3: Alternative endpoints and methods
 */
async function sendViaAlternativeEndpoints(
  zplCode: string,
  printerIP: string
): Promise<void> {
  console.log('Attempting alternative endpoints method...');

  const alternatives = [
    {
      url: `http://${printerIP}/`,
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: zplCode
    },
    {
      url: `http://${printerIP}/cgi-bin/print`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(zplCode)}`
    },
    {
      url: `http://${printerIP}/printer/print`,
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: zplCode
    }
  ];

  for (const config of alternatives) {
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        mode: 'no-cors'
      });

      console.log(`Successfully sent via ${config.url}`);
      return;
    } catch (error) {
      console.log(`Failed to send via ${config.url}:`, error);
    }
  }

  throw new Error('Alternative endpoints method failed');
}

/**
 * Method 4: WebSocket approach (if printer supports it)
 */
async function sendViaWebSocket(
  zplCode: string,
  printerIP: string
): Promise<void> {
  console.log('Attempting WebSocket method...');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${printerIP}:9100`);

    ws.onopen = () => {
      console.log('WebSocket connection opened');
      ws.send(zplCode);
    };

    ws.onmessage = (event) => {
      console.log('WebSocket response:', event.data);
      ws.close();
      resolve();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(new Error('WebSocket connection failed'));
    };

    ws.onclose = (event) => {
      if (event.wasClean) {
        resolve();
      } else {
        reject(new Error('WebSocket connection closed unexpectedly'));
      }
    };

    // Timeout after 5 seconds
    setTimeout(() => {
      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
        reject(new Error('WebSocket connection timed out'));
      }
    }, 5000);
  });
}
