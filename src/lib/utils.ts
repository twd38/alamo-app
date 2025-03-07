import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Status, PartType } from "@prisma/client"
import { prisma } from '@/lib/db';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type StatusVariant = 
  | "default" 
  | "secondary" 
  | "destructive" 
  | "outline" 
  | "todo" 
  | "in-progress" 
  | "completed" 
  | "paused" 
  | "scrapped"

type StatusConfig = {
  label: string
  variant: StatusVariant
}

export const getStatusConfig = (status: Status): StatusConfig => {
  switch (status.toLowerCase()) {
    case "todo":
      return { label: "To Do", variant: "todo" }
    case "in_progress":
      return { label: "In Progress", variant: "in-progress" }
    case "completed":
      return { label: "Completed", variant: "completed" }
    case "paused":
      return { label: "Paused", variant: "paused" }
    case "scrapped":
      return { label: "Scrapped", variant: "scrapped" }
    default:
      return { label: status, variant: "secondary" }
  }
} 

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " bytes"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

export async function generatePartType(componentPartCategories: PartType[], isRawMaterial: boolean) {
  // Get the part Type
  let partType: PartType

  // Check if component part numbers contain 200-level numbers
  if(componentPartCategories.some(partType => partType == PartType.MODULE_300)) {
      partType = PartType.ASSEMBLY_400;
  } else if (componentPartCategories.some(partType => partType == PartType.SUBASSEMBLY_200)) {
      partType = PartType.MODULE_300;
  } else if (componentPartCategories.some(partType => partType == PartType.PART_100)) {
      partType = PartType.SUBASSEMBLY_200;
  } else if (!isRawMaterial) {
      partType = PartType.PART_100;
  } else {
      partType = PartType.RAW_000;
  }

  return partType;
}

export async function generateNewPartNumbers(componentPartCategories: PartType[], isRawMaterial: boolean) {
  // Part number is [xxx]-[yyyyy]
  // xxx is the Type
  // yyyyy is the sequence number in the Type

  const partType = await generatePartType(componentPartCategories, isRawMaterial);
  

  // Get the last part number in the Type
  const lastBasePartNumber = await prisma.part.findFirst({
      orderBy: {
          basePartNumber: 'desc'
      },
  });

  // Get the sequence number
  const sequenceBaseNumber = lastBasePartNumber ? parseInt(lastBasePartNumber.partNumber.split("-")[0]) : 10000000;
  // Increment the sequence number
  const newSequenceBaseNumber = sequenceBaseNumber + 1;

  // Version number is 1
  const versionNumber = "1";

  // Get the part Type number from the part Type by getting last 3 digits of string
  const partTypeNumber = partType.toString().slice(-3);

  // Add version number to Type number
  const partTypeNumberWithVersion = parseInt(partTypeNumber) + parseInt(versionNumber);

  // Create the new part number
  const newPartNumber = `${newSequenceBaseNumber}-${partTypeNumberWithVersion}`;

  return {
      basePartNumber: newSequenceBaseNumber,
      versionNumber: versionNumber,
      partTypeNumber: partTypeNumber,
      partNumber: newPartNumber,
      partType: partType
  };
}

export function formatPartType(partType: PartType) {
  const partTypeTranslation = {
    [PartType.ASSEMBLY_400]: "Assembly",
    [PartType.MODULE_300]: "Module",
    [PartType.SUBASSEMBLY_200]: "Subassembly",
    [PartType.PART_100]: "Part",
    [PartType.RAW_000]: "Raw Material",
    [PartType.BIN]: "Bin",
    [PartType.SHIP]: "Ship",
  }

  return partTypeTranslation[partType];
}
