import { NextRequest, NextResponse } from 'next/server';
import { getViewerToken } from '@/lib/aps';

/**
 * GET /api/aps/token
 * Returns a viewer token for the Autodesk Viewer
 */
export async function GET() {
  try {
    const tokenData = await getViewerToken();

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Failed to get viewer token:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to get viewer token: ${errorMessage}` },
      { status: 500 }
    );
  }
}
