import { atomWithHash } from 'jotai-location'

export type TaskModalType = string | "new" | null;

export const taskModal = atomWithHash<TaskModalType>("task", null);