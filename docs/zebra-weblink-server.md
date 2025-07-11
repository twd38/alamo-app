# Zebra Cloud API Integration Documentation

## Overview

The Zebra Cloud API integration allows printing labels directly to registered Zebra printers through Zebra's cloud service. This eliminates the need for local network connectivity and provides a more reliable printing solution that works from anywhere with internet access.

## Architecture

```
Web Browser → Next.js API (/api/print-label) → Zebra Cloud API → Zebra Printer
```

### Why This Approach Works

1. **No Network Configuration**: No need to manage local network setup or IP addresses
2. **Remote Printing**: Print to any registered Zebra printer from anywhere with internet
3. **Centralized Management**: Manage all printers through Zebra's cloud platform
4. **Enhanced Security**: Secure authentication through API keys and tenant credentials

## Prerequisites

### Environment Variables

Set up the following environment variables in your `.env` file:

```env
ZEBRA_API_KEY=your_zebra_api_key_here
ZEBRA_TENANT=your_zebra_tenant_id_here
```

### Printer Registration

1. Register your Zebra printer with Zebra Cloud Services
2. Note the printer's serial number (e.g., "D2J185007015")
3. Ensure the printer is connected to the internet and registered

## API Endpoints

### POST `/api/print-label`

Sends a print job to a Zebra printer via the Zebra Cloud API.

**Request Body:**

```json
{
  "labelData": {
    "workOrderNumber": "WO-2024-001",
    "partNumber": "PART-001",
    "partName": "Sample Part",
    "quantity": 1,
    "dueDate": "2024-01-15",
    "workOrderId": "workorder-id-123",
    "baseUrl": "https://yourdomain.com"
  },
  "printerSerialNumber": "D2J185007015"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Label sent to printer successfully via Zebra Cloud API",
  "method": "Zebra Cloud API",
  "printerSerialNumber": "D2J185007015"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Failed to send label to printer",
  "details": "Zebra Cloud API request failed: 401 Unauthorized"
}
```

### GET `/api/print-label/test`

Tests connectivity to a Zebra printer via the Cloud API.

**Query Parameters:**

- `sn` (optional): Printer serial number (defaults to D2J185007015)

**Example:**

```
GET /api/print-label/test?sn=D2J185007015
```

**Response:**

```json
{
  "success": true,
  "printerSerialNumber": "D2J185007015",
  "method": "Zebra Cloud API",
  "message": "Test label sent successfully to printer D2J185007015 via Zebra Cloud API"
}
```

## Client-Side Usage

### PrintLabelButton Component

The `PrintLabelButton` component sends labels via the Zebra Cloud API:

```typescript
import { PrintLabelButton } from '@/components/production/print-label-button';

<PrintLabelButton
  workOrderNumber="WO-2024-001"
  partNumber="PART-001"
  partName="Sample Part"
  quantity={1}
  dueDate="2024-01-15"
  workOrderId="workorder-id-123"
  printerSerialNumber="D2J185007015"
  variant="outline"
  size="default"
/>
```

### Manual API Call

You can also call the API directly:

```typescript
const printLabel = async () => {
  try {
    const response = await fetch('/api/print-label', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        labelData: {
          workOrderNumber: 'WO-2024-001',
          partNumber: 'PART-001',
          partName: 'Sample Part',
          quantity: 1,
          dueDate: '2024-01-15',
          workOrderId: 'workorder-id-123',
          baseUrl: window.location.origin
        },
        printerSerialNumber: 'D2J185007015'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Print successful:', result.method);
    } else {
      console.error('Print failed:', result.error);
    }
  } catch (error) {
    console.error('API error:', error);
  }
};
```

## Testing Component

Use the `PrinterTest` component to test printer connectivity:

```typescript
import { PrinterTest } from '@/components/production/printer-test';

<PrinterTest />
```

Features:

- Test Cloud API connectivity
- Print test labels
- Visual feedback on connection status
- Support for custom printer serial numbers

## Configuration

### Printer Setup

1. **Register with Zebra Cloud**: Ensure your printer is registered with Zebra Cloud Services
2. **Internet Connection**: Printer must have internet connectivity
3. **Serial Number**: Note your printer's serial number for configuration

### API Credentials

1. **Zebra API Key**: Obtain from Zebra Developer Portal
2. **Tenant ID**: Your Zebra Cloud tenant identifier
3. **Environment Variables**: Set `ZEBRA_API_KEY` and `ZEBRA_TENANT` in `.env`

## Testing

### Command Line Testing

Use the provided test script:

```bash
# Test with default printer (D2J185007015)
node scripts/test-printer.js

# Test with specific printer serial number
node scripts/test-printer.js "YOUR_PRINTER_SERIAL"
```

### Web Interface Testing

Visit the admin panel at `/admin` and navigate to the "Printers" tab to test connectivity through the web interface.

## Troubleshooting

### Common Issues

1. **Invalid API Credentials**
   - Verify `ZEBRA_API_KEY` and `ZEBRA_TENANT` are correct
   - Check API key permissions in Zebra Developer Portal

2. **Printer Not Found**
   - Ensure printer serial number is correct
   - Verify printer is registered with Zebra Cloud
   - Check printer's internet connectivity

3. **Network Issues**
   - Verify server has internet access
   - Check firewall settings for outbound HTTPS connections
   - Ensure no proxy issues blocking API requests

### Error Codes

- **401 Unauthorized**: Invalid API credentials
- **404 Not Found**: Printer serial number not found
- **500 Internal Server Error**: Network or configuration issue

## Security Considerations

1. **API Key Management**: Store API keys securely in environment variables
2. **Network Security**: All communication uses HTTPS
3. **Printer Access**: Only registered printers can be accessed
4. **Authentication**: Zebra Cloud API handles all authentication securely

## Migration from Local Network Printing

If migrating from local network printing:

1. Register printers with Zebra Cloud
2. Update environment variables with API credentials
3. Replace IP addresses with serial numbers in configurations
4. Test connectivity through the new Cloud API endpoints
