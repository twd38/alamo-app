import { NextRequest, NextResponse } from 'next/server';
import { createPart } from '@/lib/actions';
import { z } from 'zod';
import { TrackingType, BOMType, Part } from '@prisma/client';

/**
 * Zod schema for validating part creation requests.
 */
const partSchema = z.object({
  partNumber: z.string().optional(),
  partRevision: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required' }),
  unit: z.string().min(1, { message: 'Unit of measure is required' }),
  trackingType: z.nativeEnum(TrackingType),
  partImage: z.any().optional(), // File uploads not supported via JSON API
  isRawMaterial: z.boolean().default(false),
  files: z.array(z.any()).default([]), // File uploads not supported via JSON API
  bomParts: z.array(
    z.object({
      id: z.string(),
      part: z.any(), // Should be Part, but we accept any for now
      qty: z.number().min(1),
      bomType: z.nativeEnum(BOMType),
    })
  ).default([]),
  nxFilePath: z.string().optional(),
});

/**
 * API endpoint for creating a new part.
 * Accepts POST requests with part data in the request body.
 * Validates input using Zod and delegates creation to createPart action.
 *
 * @param req - The Next.js request object
 * @returns A JSON response with the result of the part creation
 */
export async function POST(req: NextRequest) {
  try {
    // Get the API key from the request headers
    const apiKey = req.headers.get('X-API-KEY');
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    // Verify the API key
    if (apiKey !== process.env.ALAMO_API_KEY) {
      return NextResponse.json({
        success: false, 
        error: 'Unauthorized',
      }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = partSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        issues: parseResult.error.issues,
      }, { status: 400 });
    }

    // File uploads are not supported via JSON API
    // If files/partImage are present, ignore or error
    if (parseResult.data.files.length > 0 || parseResult.data.partImage) {
      return NextResponse.json({
        success: false,
        error: 'File uploads are not supported via this endpoint. Use the web UI.',
      }, { status: 400 });
    }

    // Ensure all bomParts have a required 'part' property
    const missingPart = parseResult.data.bomParts.some((bomPart) => !bomPart.part);
    if (missingPart) {
      return NextResponse.json({
        success: false,
        error: 'Each BOM part must include a valid part object.',
      }, { status: 400 });
    }

    // Cast bomParts to the correct type for createPart
    const safeData = {
      ...parseResult.data,
      bomParts: parseResult.data.bomParts as {
        id: string;
        part: Part;
        qty: number;
        bomType: BOMType;
      }[],
    };

    const result = await createPart(safeData);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
