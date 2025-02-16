import { atomWithHash } from 'jotai-location'
import { Task } from '@prisma/client';

export type TaskModalType = Task | "new" | null;

export const taskModal = atomWithHash<TaskModalType>("task", null);
``