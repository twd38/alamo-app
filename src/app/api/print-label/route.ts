import { NextRequest, NextResponse } from 'next/server';
import {
  generatePartLabelZPL,
  sendZPLToPrinter,
  type PartLabelData
} from '@/lib/label-printing';

/**
 * POST /api/print-label
 * Sends print requests to Zebra printers via Zebra Cloud API
 *
 * This endpoint receives print requests from the client and sends them
 * to the registered Zebra printer using the cloud-based API.
 * Supports printing multiple labels based on the quantity specified in labelData.
 * Quantity defaults to 1 if not provided and is limited to a maximum of 100.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { labelData, printerSerialNumber = 'D2J185007015' } = body;

    // Validate required fields
    if (!labelData || !labelData.workOrderNumber || !labelData.partNumber) {
      return NextResponse.json(
        { error: 'Missing required label data' },
        { status: 400 }
      );
    }

    // Validate quantity if provided
    const quantity = labelData.quantity || 1;
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.ZEBRA_API_KEY || !process.env.ZEBRA_TENANT) {
      return NextResponse.json(
        { error: 'Zebra API credentials not configured' },
        { status: 500 }
      );
    }

    // Generate ZPL code from label data (includes quantity for multiple copies)
    const zplCode = generatePartLabelZPL(labelData as PartLabelData);

    // Send to printer via Zebra Cloud API
    await sendZPLToPrinter(zplCode, printerSerialNumber);

    return NextResponse.json({
      success: true,
      message: `${quantity} label${quantity > 1 ? 's' : ''} sent to printer successfully via Zebra Cloud API`,
      method: 'Zebra Cloud API',
      printerSerialNumber,
      quantity
    });
  } catch (error) {
    console.error('Print label API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to send label to printer',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
