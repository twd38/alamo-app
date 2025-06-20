type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
/**
 * Configuration for task priorities
 */
export type PriorityConfig = {
  /**
   * The textual name of the priority. Kept for display purposes and
   * for any legacy logic that still expects the enum value.
   */
  readonly name: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  /** The Tailwind colour used for the priority badge. */
  readonly color: 'blue' | 'amber' | 'orange' | 'red';
  /** A human-friendly label shown in the UI. */
  readonly label: string;
};

/**
 * Mapping between the numeric priority value stored in the database
 * and the configuration required by the UI.
 *
 * 0 → Low
 * 1 → Medium
 * 2 → High
 * 3 → Critical
 */
export const PRIORITY_CONFIG: Record<number, PriorityConfig> = {
  0: {
    name: 'LOW',
    color: 'blue',
    label: 'Low'
  },
  1: {
    name: 'MEDIUM',
    color: 'amber',
    label: 'Medium'
  },
  2: {
    name: 'HIGH',
    color: 'orange',
    label: 'High'
  },
  3: {
    name: 'CRITICAL',
    color: 'red',
    label: 'Critical'
  }
} as const;

/**
 * Get priority configuration by numeric value.
 * @param priority – 0-based integer value of the priority.
 */
export const getPriorityConfig = (priority: number): PriorityConfig => {
  return PRIORITY_CONFIG[priority];
};

/**
 * Get all priority configurations.
 */
export const getAllPriorityConfigs = (): PriorityConfig[] => {
  return Object.values(PRIORITY_CONFIG);
};

/**
 * Map numeric priority value to enum string (used by backend helper types).
 */
export const PRIORITY_VALUE_TO_ENUM: Record<number, Priority> = {
  0: 'LOW',
  1: 'MEDIUM',
  2: 'HIGH',
  3: 'CRITICAL'
} as const;

/**
 * Map enum string to numeric priority value.
 */
export const PRIORITY_ENUM_TO_VALUE: Record<Priority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
} as const;
