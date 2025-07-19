import { NextRequest, NextResponse } from 'next/server';
import { getAPSToken, getTranslationStatus } from '@/lib/aps';

/**
 * Decode URN if it's base64 encoded, otherwise return as-is
 */
function decodeUrn(urn: string): string {
  try {
    // Check if it's a base64-encoded URN by trying to decode it
    if (!urn.startsWith('urn:')) {
      const decoded = Buffer.from(urn, 'base64').toString('utf-8');
      if (decoded.startsWith('urn:')) {
        console.log(`Decoded base64 URN: ${decoded}`);
        return decoded;
      }
    }
    // Return as-is if it's already a raw URN
    return urn;
  } catch (error) {
    // If decoding fails, return the original URN
    return urn;
  }
}

/**
 * GET /api/aps/translate/[urn]
 * Returns the translation status for a given URN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ urn: string }> }
) {
  try {
    const { urn: rawUrn } = await params;

    if (!rawUrn) {
      return NextResponse.json(
        { error: 'URN parameter is required' },
        { status: 400 }
      );
    }

    // Decode URN if it's base64 encoded
    const urn = decodeUrn(rawUrn);
    console.log(`Checking translation status for URN: ${urn}`);

    // Get APS token
    const token = await getAPSToken();

    // Get translation status
    const manifest = await getTranslationStatus(urn, token);

    // Process the manifest to extract useful information
    const status = manifest.status;
    const progress = manifest.progress;

    // Check if translation is complete and successful
    let isComplete = false;
    let hasErrors = false;
    const derivatives = [];

    if (manifest.derivatives) {
      for (const derivative of manifest.derivatives) {
        derivatives.push({
          name: derivative.name,
          hasThumbnail: derivative.hasThumbnail,
          status: derivative.status,
          progress: derivative.progress,
          outputType: derivative.outputType,
          children: derivative.children || []
        });

        if (derivative.status === 'success') {
          isComplete = true;
        } else if (derivative.status === 'failed') {
          hasErrors = true;
        }
      }
    }

    console.log(
      `Translation status: ${status}, Progress: ${progress}, Complete: ${isComplete}`
    );

    return NextResponse.json({
      urn,
      status,
      progress,
      isComplete,
      hasErrors,
      derivatives,
      manifest // Include full manifest for debugging
    });
  } catch (error) {
    console.error('Failed to get translation status:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to get translation status: ${errorMessage}` },
      { status: 500 }
    );
  }
}
