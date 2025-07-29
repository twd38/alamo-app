'use server';

import { prisma } from '@/lib/db';
import { generateNewPartNumberSimpleSix } from '@/lib/utils';

export async function duplicatePart({
  originalPartId,
  newName,
  newPartNumber
}: {
  originalPartId: string;
  newName: string;
  newPartNumber?: string;
}) {
  try {
    // Fetch the original part with all associated data
    const originalPart = await prisma.part.findUnique({
      where: { id: originalPartId },
      include: {
        partImage: true,
        cadFile: true,
        gltfFile: true,
        files: true,
        bomParts: {
          include: {
            part: true
          }
        },
        workInstructions: {
          include: {
            steps: {
              include: {
                actions: true,
                images: true,
                files: true
              }
            }
          }
        }
      }
    });

    if (!originalPart) {
      throw new Error('Original part not found');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the new part
      const newPart = await tx.part.create({
        data: {
          name: newName,
          partNumber: newPartNumber || generateNewPartNumberSimpleSix(),
          partRevision: originalPart.partRevision,
          description: originalPart.description,
          unit: originalPart.unit,
          trackingType: originalPart.trackingType,
          partType: originalPart.partType,
          basePartNumber: originalPart.basePartNumber,
          versionNumber: originalPart.versionNumber,
          nxFilePath: originalPart.nxFilePath,
          supplierPartNumber: originalPart.supplierPartNumber,
          // Note: Not copying partImageId, cadFileId, gltfFileId directly
          // Instead, we'll duplicate the file records
        }
      });

      // Duplicate file records (not the actual files, just the database records)
      const fileMapping: { [oldId: string]: string } = {};
      
      // Handle part image
      if (originalPart.partImage) {
        const newPartImage = await tx.file.create({
          data: {
            name: originalPart.partImage.name,
            size: originalPart.partImage.size,
            type: originalPart.partImage.type,
            url: originalPart.partImage.url,
            key: originalPart.partImage.key,
            partId: newPart.id
          }
        });
        fileMapping[originalPart.partImage.id] = newPartImage.id;
        
        // Update part with new image reference
        await tx.part.update({
          where: { id: newPart.id },
          data: { partImageId: newPartImage.id }
        });
      }

      // Handle CAD file
      if (originalPart.cadFile) {
        const newCadFile = await tx.file.create({
          data: {
            name: originalPart.cadFile.name,
            size: originalPart.cadFile.size,
            type: originalPart.cadFile.type,
            url: originalPart.cadFile.url,
            key: originalPart.cadFile.key,
            partId: newPart.id
          }
        });
        fileMapping[originalPart.cadFile.id] = newCadFile.id;
        
        // Update part with new CAD file reference
        await tx.part.update({
          where: { id: newPart.id },
          data: { cadFileId: newCadFile.id }
        });
      }

      // Handle GLTF file
      if (originalPart.gltfFile) {
        const newGltfFile = await tx.file.create({
          data: {
            name: originalPart.gltfFile.name,
            size: originalPart.gltfFile.size,
            type: originalPart.gltfFile.type,
            url: originalPart.gltfFile.url,
            key: originalPart.gltfFile.key,
            partId: newPart.id
          }
        });
        fileMapping[originalPart.gltfFile.id] = newGltfFile.id;
        
        // Update part with new GLTF file reference
        await tx.part.update({
          where: { id: newPart.id },
          data: { gltfFileId: newGltfFile.id }
        });
      }

      // Handle other associated files
      for (const file of originalPart.files) {
        // Skip files that are already handled as special references
        if (file.id === originalPart.partImageId || 
            file.id === originalPart.cadFileId || 
            file.id === originalPart.gltfFileId) {
          continue;
        }
        
        const newFile = await tx.file.create({
          data: {
            name: file.name,
            size: file.size,
            type: file.type,
            url: file.url,
            key: file.key,
            partId: newPart.id
          }
        });
        fileMapping[file.id] = newFile.id;
      }

      // Duplicate BOM parts
      for (const bomPart of originalPart.bomParts) {
        await tx.bOMPart.create({
          data: {
            parentPartId: newPart.id,
            partId: bomPart.partId,
            qty: bomPart.qty,
            bomType: bomPart.bomType
          }
        });
      }

      // Duplicate work instructions
      for (const workInstruction of originalPart.workInstructions) {
        const newWorkInstruction = await tx.workInstruction.create({
          data: {
            partId: newPart.id,
            title: workInstruction.title,
            description: workInstruction.description,
            baseInstructionNumber: null, // Let it generate new
            versionNumber: workInstruction.versionNumber,
            instructionNumber: generateNewPartNumberSimpleSix(), // Generate new instruction number
            status: workInstruction.status,
            createdById: workInstruction.createdById
          }
        });

        // Duplicate work instruction steps
        for (const step of workInstruction.steps) {
          const newStep = await tx.workInstructionStep.create({
            data: {
              workInstructionId: newWorkInstruction.id,
              stepNumber: step.stepNumber,
              title: step.title,
              instructions: step.instructions,
              estimatedLabourTime: step.estimatedLabourTime,
              requiredTools: step.requiredTools
            }
          });

          // Duplicate step actions
          for (const action of step.actions) {
            await tx.workInstructionStepAction.create({
              data: {
                stepId: newStep.id,
                description: action.description,
                notes: action.notes,
                isRequired: action.isRequired,
                signoffRoles: action.signoffRoles,
                targetValue: action.targetValue,
                tolerance: action.tolerance,
                unit: action.unit,
                actionType: action.actionType,
                // Note: uploadedFileId is not duplicated as it references specific files
              }
            });
          }

          // Duplicate step images
          for (const image of step.images) {
            if (fileMapping[image.id]) {
              await tx.file.update({
                where: { id: fileMapping[image.id] },
                data: { stepId: newStep.id }
              });
            }
          }

          // Duplicate step files
          for (const file of step.files) {
            if (fileMapping[file.id]) {
              await tx.file.update({
                where: { id: fileMapping[file.id] },
                data: { stepFileId: newStep.id }
              });
            }
          }
        }
      }

      return newPart;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error duplicating part:', error);
    
    let errorMessage = 'Failed to duplicate part';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }

    return { success: false, error: errorMessage };
  }
}