import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Status } from "@prisma/client"

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