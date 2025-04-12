import { getPresignedDownloadUrl } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

// This route is used to get the presigned URL for the image
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const { key } = params;
  console.log("KEY: ", key);
  const fullKey = "/content/" + key;
  const url = await getPresignedDownloadUrl(fullKey);
  return NextResponse.redirect(url);
}