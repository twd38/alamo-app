'use server';

import { prisma } from '@/lib/db';
import { Part, BOMType, PartType, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function updatePart({
  id,
  name,
  partNumber,
  description,
  unit,
  trackingType,
  partType,
  partImageId,
  partImageData,
  bomParts = [],
  isRawMaterial,
  apsUrn
}: {
  id: string;
  name?: string;
  partNumber?: string;
  description?: Part['description'];
  unit?: Part['unit'];
  trackingType?: Part['trackingType'];
  partType?: Part['partType'];
  partImageId?: string | null;
  partImageData?: Prisma.FileCreateInput | null;
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
    if (name !== undefined) updateData.name = name;
    if (partNumber !== undefined) updateData.partNumber = partNumber;
    if (description !== undefined) updateData.description = description;
    if (unit !== undefined) updateData.unit = unit;
    if (trackingType !== undefined) updateData.trackingType = trackingType;
    if (partType !== undefined) updateData.partType = partType;

    // Handle part image updates
    if (partImageData !== undefined) {
      if (partImageData === null) {
        // Remove image
        updateData.partImage = { disconnect: true };
      } else {
        // Create new image file and connect it
        updateData.partImage = {
          create: partImageData
        };
      }
    } else if (partImageId !== undefined) {
      // Legacy support for partImageId
      updateData.partImage = partImageId
        ? { connect: { id: partImageId } }
        : { disconnect: true };
    }

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
        },
        partImage: true
      }
    });

    revalidatePath(`/parts/library/${id}`);

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
