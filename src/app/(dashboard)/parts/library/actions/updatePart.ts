'use server';

import { prisma } from '@/lib/db';
import { Part, BOMType, Prisma } from '@prisma/client';

export async function updatePart({
  id,
  partNumber,
  description,
  unit,
  trackingType,
  bomParts = [],
  isRawMaterial,
  apsUrn
}: {
  id: string;
  partNumber?: string;
  description?: Part['description'];
  unit?: Part['unit'];
  trackingType?: Part['trackingType'];
  isRawMaterial?: boolean;
  apsUrn?: string;
  bomParts?: {
    id: string;
    part: Part;
    qty: number;
    bomType: BOMType;
  }[];
}) {
  try {
    // Get existing part with its relationships
    const existingPart = await prisma.part.findUnique({
      where: { id },
      include: {
        bomParts: {
          include: {
            part: true
          }
        }
      }
    });

    if (!existingPart) {
      throw new Error('Part not found');
    }

    // Prepare update data object
    const updateData: Prisma.PartUpdateInput = {};

    // Only update fields that are provided
    if (partNumber !== undefined) updateData.partNumber = partNumber;
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (trackingType !== undefined) updateData.trackingType = trackingType;
    if (apsUrn !== undefined) updateData.apsUrn = apsUrn;

    // Handle BOM parts updates if provided
    if (bomParts !== undefined) {
      // Delete existing BOM parts
      await prisma.bOMPart.deleteMany({
        where: { parentPartId: id }
      });

      // Create new BOM parts
      updateData.bomParts = {
        create: bomParts.map((bomPart) => ({
          partId: bomPart.part.id,
          qty: bomPart.qty,
          bomType: bomPart.bomType
        }))
      };
    }

    // Update part with provided data
    const result = await prisma.part.update({
      where: { id },
      data: updateData,
      include: {
        bomParts: {
          include: {
            part: true
          }
        }
      }
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error updating part:', error.stack);

    let errorMessage = 'Failed to update part';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.stack}`;
    }

    return { success: false, error: errorMessage };
  }
}
