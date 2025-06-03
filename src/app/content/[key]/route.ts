import { getSignedDownloadUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

// This route is used to get the presigned URL for the image.
// This is primarily used for downloading files from the R2 bucket for Novel editor content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const fullKey = "/content/" + key;
  const url = await getSignedDownloadUrl(fullKey);
  return NextResponse.redirect(url);
}