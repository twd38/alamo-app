import { Priority } from "@prisma/client";

/**
 * Configuration for task priorities
 */
type PriorityConfig = {
  name: Priority;
  color: "blue" | "amber" | "orange" | "red";
  label: string;
};

/**
 * Priority configuration mapping
 * Colors are using Tailwind CSS classes
 */
export const PRIORITY_CONFIG: Record<Priority, PriorityConfig> = {
  LOW: {
    name: "LOW",
    color: "blue",
    label: "Low",
  },
  MEDIUM: {
    name: "MEDIUM",
    color: "amber",
    label: "Medium",
  },
  HIGH: {
    name: "HIGH",
    color: "orange",
    label: "High",
  },
  CRITICAL: {
    name: "CRITICAL",
    color: "red",
    label: "Critical",
  },
} as const;

/**
 * Get priority configuration by priority name
 * @param priority - The priority name
 * @returns The priority configuration
 */
export const getPriorityConfig = (priority: Priority): PriorityConfig => {
  return PRIORITY_CONFIG[priority];
};

/**
 * Get all priority configurations
 * @returns Array of priority configurations
 */
export const getAllPriorityConfigs = (): PriorityConfig[] => {
  return Object.values(PRIORITY_CONFIG);
}; 