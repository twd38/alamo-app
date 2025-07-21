import { getSignedDownloadUrl } from '@/lib/server/r2';
import { NextRequest, NextResponse } from 'next/server';

// This is primarily used for downloading files from the R2 bucket for Novel editor content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    // Have to append the content folder to the key because its stripped from the api call
    const fullKey = `content/${key}`;
    const signedUrl = await getSignedDownloadUrl(fullKey);

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('Error getting content:', error);
    return NextResponse.json(
      { error: 'Failed to get content' },
      { status: 500 }
    );
  }
}
