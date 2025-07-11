import { NextRequest, NextResponse } from 'next/server';
import { testPrinterConnection } from '@/lib/label-printing';

/**
 * GET /api/print-label/test
 * Test printer connectivity via Zebra Cloud API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const printerSerialNumber = searchParams.get('sn') || 'D2J185007015';

  try {
    // Validate environment variables
    if (!process.env.ZEBRA_API_KEY || !process.env.ZEBRA_TENANT) {
      return NextResponse.json(
        {
          success: false,
          printerSerialNumber,
          error: 'Zebra API credentials not configured'
        },
        { status: 500 }
      );
    }

    // Test the printer connection via cloud API
    const result = await testPrinterConnection(printerSerialNumber);

    return NextResponse.json({
      success: result.success,
      printerSerialNumber,
      method: result.success ? 'Zebra Cloud API' : undefined,
      message: result.success ? result.message : result.error
    });
  } catch (error) {
    console.error('Printer test API error:', error);

    return NextResponse.json(
      {
        success: false,
        printerSerialNumber,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to test printer connection'
      },
      { status: 500 }
    );
  }
}
