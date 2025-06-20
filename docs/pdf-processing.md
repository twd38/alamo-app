# PDF Processing with OpenAI Vision API

This document explains how to use the PDF attachment processing feature, which allows extracting structured order information from PDF files using OpenAI's Vision API.

## Overview

The application now supports:

1. Automatically extracting PDF attachments from Gmail emails
2. Processing these PDFs with OpenAI's Vision API to extract order details
3. Combining email text content with PDF content for more comprehensive analysis
4. A standalone API endpoint for direct PDF processing

## Requirements

- OpenAI API key with access to GPT-4o model (supports PDF processing)
- PDF attachments must contain order information in a readable format
- Maximum PDF attachment size: 20MB (OpenAI API limitation)

## How It Works

### Integrated Email and PDF Processing

When fetching emails from Gmail, the system:

1. Detects PDF attachments in emails
2. Downloads the attachments as base64-encoded data
3. Sends both the email content AND the PDF attachment to OpenAI's Vision API in a single request
4. OpenAI analyzes both sources of information and extracts the most comprehensive structured order information
5. The extracted order information is used to create or update an order in the database

This integrated approach ensures that information from both the email body and any attached PDFs is considered when extracting order details, providing the most complete and accurate data possible.

### Direct PDF Processing API

A standalone API endpoint is available at `/api/process-pdf` for direct PDF processing, which can also include email context:

**Request:**

```json
POST /api/process-pdf
Content-Type: application/json

{
  "pdfBase64": "BASE64_ENCODED_PDF_DATA",
  "from": "optional-sender@example.com",
  "date": "Optional Date String",
  "subject": "Optional Email Subject",
  "snippet": "Optional email content or message"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-12345",
    "supplier": "Example Supplier",
    "status": "shipped",
    "estimatedArrival": "2024-05-20",
    "deliveredAt": null,
    "productList": [
      {
        "name": "Product Name",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "totalPrice": 59.98,
    "currency": "USD",
    "trackingNumber": "TRK12345",
    "trackingUrl": "https://example.com/track/TRK12345",
    "additionalNotes": null
  }
}
```

## Implementation Details

The PDF processing is integrated with the email text processing in the `parseOrderWithAI` function, which:

1. Accepts both email content and an optional PDF attachment
2. When a PDF is provided, sends both content sources to the OpenAI Vision API
3. When no PDF is provided, uses the standard text-based completion API
4. Returns a unified structured data result regardless of the input sources

This approach allows for seamless handling of orders that may have information split between email content and attached documents.

## Testing PDF Processing

A utility script is provided to convert local PDF files to base64 for testing:

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run the conversion script
ts-node scripts/convert-pdf-to-base64.ts ./path/to/your-file.pdf
```

This will generate:

- `your-file.base64.txt`: Contains the raw base64 data
- `your-file.json`: Contains a JSON object ready for testing the API

To test the API:

```bash
curl -X POST http://localhost:3000/api/process-pdf \
  -H "Content-Type: application/json" \
  -d @./path/to/your-file.json
```

You can add email context to your test by modifying the generated JSON file to include email fields:

```json
{
  "pdfBase64": "BASE64_DATA_HERE",
  "from": "supplier@example.com",
  "date": "2023-05-10T12:00:00Z",
  "subject": "Your Order #12345 Has Shipped",
  "snippet": "Thank you for your order. Your shipment is on its way..."
}
```

## Limitations

- PDF processing is limited by OpenAI's token limits and may not work well with very large PDFs
- The system currently only processes the first PDF attachment in an email
- Complex or heavily image-based PDFs may not be parsed accurately
- PDFs without text content (scanned documents without OCR) may not be processed correctly
- Processing costs OpenAI API credits based on the size and complexity of the PDF

## Troubleshooting

If PDF processing fails:

1. Check that your OpenAI API key is valid and has sufficient credits
2. Verify the PDF is properly formatted and contains text content (not just images)
3. Try reducing the PDF file size if it's large
4. Check the server logs for specific error messages
5. Ensure the PDF contains order information in a readable format
