'use server';

import { prisma } from '@/lib/db';
import { Part, PartType, BOMType } from '@prisma/client';
import { generateNewPartNumberSimpleSix } from '@/lib/utils';

export async function createPart({
  name,
  partNumber,
  partRevision = 'A',
  description,
  unit,
  trackingType,
  partType,
  partImageId,
  fileIds,
  bomParts = [] // Default to empty array to avoid null
}: {
  name: string;
  partNumber?: string;
  partRevision?: Part['partRevision'];
  description: Part['description'];
  unit: Part['unit'];
  trackingType: Part['trackingType'];
  partType: PartType;
  partImageId?: string;
  fileIds?: string[];
  bomParts:
    | {
        id: string;
        part: Part;
        qty: number;
        bomType: BOMType;
      }[]
    | [];
  nxFilePath?: string;
}) {
  try {
    // Ensure bomParts is an array
    if (!bomParts || !Array.isArray(bomParts)) {
      bomParts = [];
    }

    // Validate file IDs exist if provided
    if (fileIds && fileIds.length > 0) {
      const existingFiles = await prisma.file.findMany({
        where: { id: { in: fileIds } },
        select: { id: true }
      });

      const foundFileIds = existingFiles.map((f) => f.id);
      const invalidFileIds = fileIds.filter((id) => !foundFileIds.includes(id));

      if (invalidFileIds.length > 0) {
        throw new Error(`Invalid file IDs: ${invalidFileIds.join(', ')}`);
      }
    }

    // Create the part cat if not provided
    const componentPartTypes: PartType[] = [];
    for (const bomPart of bomParts) {
      if (bomPart.part.partType) {
        componentPartTypes.push(bomPart.part.partType);
      }
    }

    // Use a transaction for all database operations to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the part first
      const newPart = await tx.part.create({
        data: {
          name,
          partNumber: partNumber || generateNewPartNumberSimpleSix(),
          partRevision,
          description,
          unit,
          trackingType,
          partType,
          partImageId
        }
      });

      // Link existing files to the part if they exist
      if (fileIds && fileIds.length > 0) {
        await tx.file.updateMany({
          where: { id: { in: fileIds } },
          data: { partId: newPart.id }
        });
      }

      // Create BOM parts one by one
      for (const bomPart of bomParts) {
        await tx.bOMPart.create({
          data: {
            parentPartId: newPart.id,
            partId: bomPart.part.id,
            qty: bomPart.qty,
            bomType: bomPart.bomType
          }
        });
      }

      return newPart;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error creating part:', error.stack);

    let errorMessage = 'Failed to create part';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.stack}`;
    }

    return { success: false, error: errorMessage };
  }
}
